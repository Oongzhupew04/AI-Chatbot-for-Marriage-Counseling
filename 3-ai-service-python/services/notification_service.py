from pywebpush import webpush, WebPushException
import os
import json
import requests
from datetime import datetime
from services.checkin_service import CheckinService
from repositories.user_repo import UserRepository
from repositories.push_subscription_repo import PushSubscriptionRepository

# Read keys from .env or constants
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "xUvANKNNet0uoxU6E4YIjXVWgDWNo9serIROcv5gA6k")
VAPID_CLAIMS = {
    "sub": "mailto:vincentoong12345@gmail.com"
}

class NotificationService:
    def __init__(self):
        self.user_repo = UserRepository()
        self.sub_repo = PushSubscriptionRepository()
        self.checkin_service = CheckinService()

    def send_daily_reminders(self):
        print(f"[{datetime.now()}] Running daily push notification check...")
        users = self.user_repo.get_users_with_push_enabled()
        
        for user_id in users:
            # Check if they have a check-in today
            checkins = self.checkin_service.repo.get_recent_checkins(user_id, limit=1)
            today_str = datetime.now().strftime("%Y-%m-%d")
            
            has_checked_in_today = False
            for c in checkins:
                if c['day'].startswith(today_str):
                    has_checked_in_today = True
                    break
            
            if not has_checked_in_today:
                print(f"User {user_id} hasn't checked in today. Sending push...")
                self._send_push_to_user(user_id, "Daily Reflection", "It's time for your daily check-in. Take a moment for yourself.")

    def notify_admins_of_high_risk(self, risk_level, trigger_keyword, user_id):
        print(f"[{datetime.now()}] Notifying admins of high risk alert...")
        admins = self.user_repo.get_admins_with_push_enabled()
        
        user = self.user_repo.get_by_id(user_id)
        username = user.username if user else f"User {user_id}"

        title = "High Risk Alert Detected!"
        body = f"Risk level {risk_level} detected for {username}. Trigger keyword: '{trigger_keyword}'"
        
        for admin_id in admins:
            self._send_push_to_user(admin_id, title, body)

    def _send_push_to_user(self, user_id, title, body):
        subs = self.sub_repo.get_subscriptions_by_user(user_id)
        payload = json.dumps({"title": title, "body": body})
        
        for sub in subs:
            # Check if this is an Expo Push Token
            if sub.endpoint.startswith("ExponentPushToken["):
                expo_payload = {
                    "to": sub.endpoint,
                    "title": title,
                    "body": body,
                    "sound": "default",
                }
                try:
                    response = requests.post(
                        "https://exp.host/--/api/v2/push/send",
                        json=expo_payload,
                        headers={
                            "Accept": "application/json",
                            "Accept-encoding": "gzip, deflate",
                            "Content-Type": "application/json",
                        }
                    )
                    response.raise_for_status()
                except Exception as ex:
                    print(f"Expo Push failed for endpoint {sub.endpoint}: {ex}")
                    # Could potentially check for 'DeviceNotRegistered' in response to delete it
                continue
                
            # Otherwise, assume standard Web Push
            subscription_info = {
                "endpoint": sub.endpoint,
                "keys": {
                    "p256dh": sub.p256dh,
                    "auth": sub.auth
                }
            }
            try:
                webpush(
                    subscription_info=subscription_info,
                    data=payload,
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims=VAPID_CLAIMS
                )
            except WebPushException as ex:
                print(f"Push failed for endpoint {sub.endpoint}: {ex}")
                # If the subscription is no longer valid, delete it
                if ex.response and ex.response.status_code in [404, 410]:
                    self.sub_repo.delete_subscription(sub.endpoint)
