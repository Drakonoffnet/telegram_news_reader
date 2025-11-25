from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

from database import engine, Base, get_db
from database import engine, Base, get_db
from models import Channel, NewsItem
import models
from scheduler import start_scheduler
from telegram_service import fetch_news_for_channel, get_telegram_client

# Create tables
Base.metadata.create_all(bind=engine)

from fastapi.staticfiles import StaticFiles
import os

# ... (existing imports)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Telegram News Reader")

# Mount static files
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class ChannelGroupCreate(BaseModel):
    name: str

class ChannelGroupResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class ChannelCreate(BaseModel):
    name: str
    group_id: int | None = None

class ChannelResponse(BaseModel):
    id: int
    name: str
    last_updated: datetime | None
    group_id: int | None

    class Config:
        from_attributes = True

class NewsItemResponse(BaseModel):
    id: int
    channel_id: int
    content: str
    image_url: str | None = None
    date: datetime
    message_id: int
    channel_name: str | None = None

    class Config:
        from_attributes = True

@app.on_event("startup")
async def startup_event():
    start_scheduler()
    # Initialize Telegram Client
    try:
        await get_telegram_client()
    except Exception as e:
        print(f"Failed to initialize Telegram Client: {e}")

# Group Endpoints
@app.post("/groups", response_model=ChannelGroupResponse)
def create_group(group: ChannelGroupCreate, db: Session = Depends(get_db)):
    db_group = db.query(models.ChannelGroup).filter(models.ChannelGroup.name == group.name).first()
    if db_group:
        raise HTTPException(status_code=400, detail="Group already exists")
    new_group = models.ChannelGroup(name=group.name)
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    return new_group

@app.get("/groups", response_model=List[ChannelGroupResponse])
def get_groups(db: Session = Depends(get_db)):
    return db.query(models.ChannelGroup).all()

@app.delete("/groups/{group_id}")
def delete_group(group_id: int, db: Session = Depends(get_db)):
    db_group = db.query(models.ChannelGroup).filter(models.ChannelGroup.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Optional: Set group_id to None for channels in this group
    channels = db.query(Channel).filter(Channel.group_id == group_id).all()
    for channel in channels:
        channel.group_id = None
    
    db.delete(db_group)
    db.commit()
    return {"ok": True}

# Channel Endpoints
@app.post("/channels", response_model=ChannelResponse)
async def add_channel(channel: ChannelCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_channel = db.query(Channel).filter(Channel.name == channel.name).first()
    if db_channel:
        raise HTTPException(status_code=400, detail="Channel already exists")
    
    new_channel = Channel(name=channel.name, group_id=channel.group_id)
    db.add(new_channel)
    db.commit()
    db.refresh(new_channel)
    
    # Trigger initial fetch in background
    background_tasks.add_task(fetch_news_for_channel, new_channel.name, db)
    
    return new_channel

@app.get("/channels", response_model=List[ChannelResponse])
def get_channels(db: Session = Depends(get_db)):
    return db.query(Channel).all()

@app.put("/channels/{channel_id}", response_model=ChannelResponse)
def update_channel(channel_id: int, channel: ChannelCreate, db: Session = Depends(get_db)):
    db_channel = db.query(Channel).filter(Channel.id == channel_id).first()
    if not db_channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    db_channel.name = channel.name
    db_channel.group_id = channel.group_id
    db.commit()
    db.refresh(db_channel)
    return db_channel

@app.delete("/channels/{channel_id}")
def delete_channel(channel_id: int, db: Session = Depends(get_db)):
    db_channel = db.query(Channel).filter(Channel.id == channel_id).first()
    if not db_channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    db.delete(db_channel)
    db.commit()
    return {"ok": True}

@app.get("/news", response_model=List[NewsItemResponse])
def get_news(skip: int = 0, limit: int = 50, group_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(NewsItem)
    
    if group_id:
        query = query.join(Channel).filter(Channel.group_id == group_id)
        
    news = query.order_by(NewsItem.date.desc()).offset(skip).limit(limit).all()
    # Enrich with channel name
    results = []
    for item in news:
        item_resp = NewsItemResponse.model_validate(item)
        item_resp.channel_name = item.channel.name
        if item.image_path:
            item_resp.image_url = f"/static/images/{item.image_path}"
        results.append(item_resp)
    return results

@app.post("/news/cleanup")
async def cleanup_news(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Delete all news items
    db.query(NewsItem).delete()
    db.commit()
    
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
    
    # Trigger fetch of all channels
    # We use background task to avoid blocking the response, 
    # but the user might want to wait? 
    # Given "Refresh" button behavior, waiting might be better if it's not too long.
    # However, fetching all channels can take time. 
    # Let's use background task and let the frontend poll or user click refresh again?
    # Or just await it? The user said "Cleanup images before refresh fetch_all_channels too".
    # If we await, the request might timeout.
    # Let's await it for now as it's the most direct interpretation of "Refresh".
    
    from telegram_service import fetch_all_channels
    await fetch_all_channels()
                
    return {"message": "Cleanup successful and fetch triggered"}
