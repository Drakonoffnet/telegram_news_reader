import os
from telethon import TelegramClient
from telethon.tl.types import Message
from sqlalchemy.orm import Session
from datetime import datetime
from models import Channel, NewsItem
from database import SessionLocal


# These should be loaded from environment variables
API_ID = os.getenv("TELEGRAM_API_ID")
API_HASH = os.getenv("TELEGRAM_API_HASH")
SESSION_NAME = "news_reader_session"

static_dir = os.path.join(os.path.dirname(__file__), "static")

client = None


async def get_telegram_client():
    global client
    if client is None:
        if not API_ID or not API_HASH:
            raise ValueError("TELEGRAM_API_ID and TELEGRAM_API_HASH must be set")
        client = TelegramClient(SESSION_NAME, int(API_ID), API_HASH)
        await client.start()
    return client


async def fetch_news_for_channel(channel_name: str, db: Session):
    client = await get_telegram_client()
    try:
        entity = await client.get_entity(channel_name)
        # Get the channel from DB to update last_updated or create if not exists
        db_channel = db.query(Channel).filter(Channel.name == channel_name).first()
        if not db_channel:
            # This might happen if called directly, but usually we add channel first
            db_channel = Channel(name=channel_name)
            db.add(db_channel)
            db.commit()
            db.refresh(db_channel)

        # Fetch last 20 messages
        messages = await client.get_messages(entity, limit=40)

        # Ensure static/images directory exists
        images_dir = os.path.join(static_dir, "images")
        os.makedirs(images_dir, exist_ok=True)

        new_items_count = 0
        for msg in messages:
            if isinstance(msg, Message) and (msg.message or msg.media):
                # Check if message already exists
                exists = (
                    db.query(NewsItem)
                    .filter(
                        NewsItem.channel_id == db_channel.id,
                        NewsItem.message_id == msg.id,
                    )
                    .first()
                )

                if not exists:
                    image_filename = None
                    if msg.media:
                        try:
                            # Download media
                            path = await client.download_media(
                                msg.media, file=images_dir
                            )
                            if path:
                                image_filename = os.path.basename(path)
                        except Exception as e:
                            print(f"Error downloading media for msg {msg.id}: {e}")

                    news_item = NewsItem(
                        channel_id=db_channel.id,
                        content=msg.message
                        or "",  # Content might be empty if it's just media
                        date=msg.date.replace(tzinfo=None),  # Naive datetime for SQLite
                        message_id=msg.id,
                        image_path=image_filename,
                    )
                    db.add(news_item)
                    new_items_count += 1

        if new_items_count > 0:
            db_channel.last_updated = datetime.utcnow()
            db.commit()

        return new_items_count
    except Exception as e:
        print(f"Error fetching news for {channel_name}: {e}")
        return 0


async def fetch_all_channels():
    # Delete all images in static/images
    images_dir = os.path.join(static_dir, "images")
    if os.path.exists(images_dir):
        for filename in os.listdir(images_dir):
            file_path = os.path.join(images_dir, filename)
            try:
                if os.path.isfile(file_path):
                    os.unlink(file_path)
            except Exception as e:
                print(f"Error deleting {file_path}: {e}")

    db = SessionLocal()
    try:
        channels = db.query(Channel).all()
        for channel in channels:
            await fetch_news_for_channel(channel.name, db)
    finally:
        db.close()
