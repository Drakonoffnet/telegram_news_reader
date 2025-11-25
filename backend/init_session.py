import os
from telethon import TelegramClient
import asyncio
from dotenv import load_dotenv

# Load environment variables from .env file in parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

API_ID = os.getenv("TELEGRAM_API_ID")
API_HASH = os.getenv("TELEGRAM_API_HASH")
SESSION_NAME = "news_reader_session"

async def main():
    if not API_ID or not API_HASH:
        print("Error: TELEGRAM_API_ID or TELEGRAM_API_HASH not found in .env file")
        return

    print(f"Initializing session '{SESSION_NAME}' with API_ID={API_ID}...")
    client = TelegramClient(SESSION_NAME, int(API_ID), API_HASH)
    await client.start()
    print("Session initialized successfully!")
    print(f"Session file created at: {os.path.abspath(SESSION_NAME + '.session')}")
    await client.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
