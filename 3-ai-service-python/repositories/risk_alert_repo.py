from database import db
from models.risk_alert import RiskAlert

class RiskAlertRepository:
    """Handles risk alert database operations."""
    
    def log_risk_alert(self, user_id, message_id, risk_level, trigger_keyword):
        """Log a risk alert to the database."""
        conn = None
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            query = """
                INSERT INTO risk_alerts (user_id, message_id, risk_level, trigger_keyword, status, timestamp)
                VALUES (?, ?, ?, ?, 'Pending Review', CURRENT_TIMESTAMP)
            """
            cursor.execute(query, (user_id, message_id, risk_level, trigger_keyword))
            conn.commit()
            cursor.close()
            return True
        except Exception as e:
            if conn:
                conn.rollback()
            print(f"Error logging risk alert: {e}")
            return False

    def get_pending_alerts_count(self):
        conn = None
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            query = "SELECT COUNT(*) FROM risk_alerts WHERE status = 'Pending Review'"
            cursor.execute(query)
            count = cursor.fetchone()[0]
            cursor.close()
            return count
        except Exception as e:
            print(f"Error getting pending alerts count: {e}")
            return 0

    def get_recent_alerts(self, limit=3):
        conn = None
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            query = """
                SELECT r.id, r.user_id, r.trigger_keyword, r.status, u.username, m.chat_id, u.email
                FROM risk_alerts r
                JOIN users u ON r.user_id = u.id
                LEFT JOIN messages m ON r.message_id = m.id
                WHERE r.status = 'Pending Review'
                ORDER BY r.timestamp DESC
                LIMIT ?
            """
            cursor.execute(query, (limit,))
            rows = cursor.fetchall()
            cursor.close()
            
            alerts = []
            for row in rows:
                alerts.append({
                    "id": row[0],
                    "user_id": row[1],
                    "trigger_keyword": row[2],
                    "status": row[3],
                    "username": row[4],
                    "chat_id": row[5],
                    "email": row[6]
                })
            return alerts
        except Exception as e:
            print(f"Error getting recent alerts: {e}")
            return []

    def get_all_alerts(self):
        conn = None
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            query = """
                SELECT r.id, r.user_id, r.trigger_keyword, r.status, u.username, m.chat_id, u.email, r.timestamp
                FROM risk_alerts r
                JOIN users u ON r.user_id = u.id
                LEFT JOIN messages m ON r.message_id = m.id
                ORDER BY r.timestamp DESC
            """
            cursor.execute(query)
            rows = cursor.fetchall()
            cursor.close()
            
            alerts = []
            for row in rows:
                timestamp = row[7]
                if timestamp:
                    if hasattr(timestamp, 'isoformat'):
                        timestamp = timestamp.isoformat()
                    else:
                        timestamp = str(timestamp)
                        
                alerts.append({
                    "id": row[0],
                    "user_id": row[1],
                    "trigger_keyword": row[2],
                    "status": row[3],
                    "username": row[4],
                    "chat_id": row[5],
                    "email": row[6],
                    "timestamp": timestamp
                })
            return alerts
        except Exception as e:
            print(f"Error getting all alerts: {e}")
            return []

    def resolve_alert(self, alert_id):
        conn = None
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            query = "UPDATE risk_alerts SET status = 'Resolved' WHERE id = ?"
            cursor.execute(query, (alert_id,))
            conn.commit()
            cursor.close()
            return True
        except Exception as e:
            if conn:
                conn.rollback()
            print(f"Error resolving alert: {e}")
            return False
