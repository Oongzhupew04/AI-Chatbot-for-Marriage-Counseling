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

    def get_average_feedback(self):
        """Calculate the average rating from all feedback."""
        conn = None
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            # The rating column is numeric (integer). Comparing it to an empty string '' causes a type error in openGauss/PostgreSQL.
            # We just need to check if it's NOT NULL.
            query = "SELECT AVG(CAST(rating AS NUMERIC)) FROM feedback WHERE rating IS NOT NULL"
            cursor.execute(query)
            avg = cursor.fetchone()[0]
            cursor.close()
            return float(avg) if avg is not None else 0.0
        except Exception as e:
            print(f"Error calculating average feedback: {e}")
            return 0.0

    def get_feedback_distribution(self):
        """Get count of feedback by rating."""
        conn = None
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            query = """
                SELECT CAST(rating AS INTEGER) as r, COUNT(*) 
                FROM feedback 
                WHERE rating IS NOT NULL 
                GROUP BY r
            """
            cursor.execute(query)
            rows = cursor.fetchall()
            cursor.close()
            
            # Ensure 1 to 5 are all represented, default to 0
            dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            for row in rows:
                if row[0] in dist:
                    dist[row[0]] = row[1]
                    
            return list(dist.values()) # Returns [count1, count2, count3, count4, count5]
        except Exception as e:
            print(f"Error calculating feedback distribution: {e}")
            return [0, 0, 0, 0, 0]
