from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class ChannelGroup(Base):
    __tablename__ = "channel_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

    channels = relationship("Channel", back_populates="group")

class Channel(Base):
    __tablename__ = "channels"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    last_updated = Column(DateTime, nullable=True)
    group_id = Column(Integer, ForeignKey("channel_groups.id"), nullable=True)

    group = relationship("ChannelGroup", back_populates="channels")
    news_items = relationship("NewsItem", back_populates="channel", cascade="all, delete-orphan")

class NewsItem(Base):
    __tablename__ = "news_items"

    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("channels.id"))
    content = Column(Text)
    image_path = Column(String, nullable=True)
    date = Column(DateTime)
    message_id = Column(Integer)

    channel = relationship("Channel", back_populates="news_items")
