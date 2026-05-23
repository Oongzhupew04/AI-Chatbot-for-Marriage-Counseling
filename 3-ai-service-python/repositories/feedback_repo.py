import json
from database import db
from models.feedback import Feedback

class FeedbackRepository:
    """Handles all feedback database operations."""
    
    def save_feedback(self, user_id, chat_id, rating, worked_well, issues, comments):
        """Save feedback to the database."""
        conn = None
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            # Serialize lists to JSON strings for database storage
            worked_well_str = json.dumps(worked_well) if worked_well else "[]"
            issues_str = json.dumps(issues) if issues else "[]"
            
            query = """
                INSERT INTO feedback (user_id, chat_id, rating, worked_well, issues, comments, timestamp)
                VALUES (?, ?, ?, cast(? as jsonb), cast(? as jsonb), ?, CURRENT_TIMESTAMP)
                RETURNING id
            """
            cursor.execute(query, (user_id, chat_id, rating, worked_well_str, issues_str, comments))
            
            feedback_id = cursor.fetchone()[0]
            conn.commit()
            cursor.close()
            
            return Feedback(
                id=feedback_id,
                user_id=user_id,
                chat_id=chat_id,
                rating=rating,
                worked_well=worked_well_str,
                issues=issues_str,
                comments=comments
            )
        except Exception as e:
            if conn:
                conn.rollback()
            print(f"Error saving feedback: {e}")
            return None
