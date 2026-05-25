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
