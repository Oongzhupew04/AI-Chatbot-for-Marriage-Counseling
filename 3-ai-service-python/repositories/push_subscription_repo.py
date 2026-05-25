# repositories/push_subscription_repo.py
from database import db
from models.push_subscription import PushSubscription

class PushSubscriptionRepository:

    def save_subscription(self, user_id, endpoint, p256dh, auth):
        cursor = db.get_connection().cursor()
        try:
            # Check if it already exists for this endpoint
            cursor.execute("SELECT id FROM push_subscriptions WHERE endpoint = ?", (endpoint,))
            existing = cursor.fetchone()
            
            if existing:
                # Update existing
                cursor.execute("""
                    UPDATE push_subscriptions
                    SET user_id = ?, p256dh = ?, auth = ?
                    WHERE endpoint = ?
                """, (user_id, p256dh, auth, endpoint))
            else:
                # Insert new
                cursor.execute("""
                    INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
                    VALUES (?, ?, ?, ?)
                """, (user_id, endpoint, p256dh, auth))
            
            db.get_connection().commit()
            return True
        except Exception as e:
            db.get_connection().rollback()
            print(f"Error saving push subscription: {e}")
            return False
        finally:
            cursor.close()

    def delete_subscription(self, endpoint):
        cursor = db.get_connection().cursor()
        try:
            cursor.execute("DELETE FROM push_subscriptions WHERE endpoint = ?", (endpoint,))
            db.get_connection().commit()
            return True
        except Exception as e:
            db.get_connection().rollback()
            print(f"Error deleting push subscription: {e}")
            return False
        finally:
            cursor.close()

    def get_subscriptions_by_user(self, user_id):
        cursor = db.get_connection().cursor()
        try:
            cursor.execute("""
                SELECT id, user_id, endpoint, p256dh, auth, created_at 
                FROM push_subscriptions WHERE user_id = ?
            """, (user_id,))
            rows = cursor.fetchall()
            return [PushSubscription(row[0], row[1], row[2], row[3], row[4], row[5]) for row in rows]
        except Exception as e:
            print(f"Error fetching subscriptions: {e}")
            return []
        finally:
            cursor.close()
