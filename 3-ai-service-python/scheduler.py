from apscheduler.schedulers.background import BackgroundScheduler
from services.notification_service import NotificationService

# We need to keep a reference to the scheduler so it isn't garbage collected
scheduler = BackgroundScheduler()

def start_scheduler():
    notif_service = NotificationService()
    
    # Run every day at 18:00 (6 PM)
    # Using 'cron' trigger, running daily at a specific time. 
    # For testing right now we can set it to run every minute if we wanted using 'interval', minutes=1
    scheduler.add_job(notif_service.send_daily_reminders, 'cron', hour=18, minute=0)
    # scheduler.add_job(notif_service.send_daily_reminders, 'interval', seconds=30)
    
    scheduler.start()
    print("APScheduler started: Daily push notifications scheduled for 18:00.")

def stop_scheduler():
    scheduler.shutdown()
