from apscheduler.schedulers.asyncio import AsyncIOScheduler
from telegram_service import fetch_all_channels

scheduler = AsyncIOScheduler()

def start_scheduler():
    # Run every hour
    scheduler.add_job(fetch_all_channels, 'interval', hours=1)
    scheduler.start()
