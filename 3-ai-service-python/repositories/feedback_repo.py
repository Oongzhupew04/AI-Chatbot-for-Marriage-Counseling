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

    def get_all_feedback(self):
        """Get all feedback with user details."""
        conn = None
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            query = """
                SELECT f.id, f.user_id, f.chat_id, f.rating, f.worked_well, f.issues, f.comments, f.timestamp, u.username, u.email
                FROM feedback f
                LEFT JOIN users u ON f.user_id = u.id
                ORDER BY f.timestamp DESC
            """
            cursor.execute(query)
            rows = cursor.fetchall()
            cursor.close()
            
            feedbacks = []
            for row in rows:
                # The worked_well and issues might be json strings from DB, parsing if possible
                try:
                    worked_well = json.loads(row[4]) if row[4] else []
                except:
                    worked_well = row[4]
                try:
                    issues = json.loads(row[5]) if row[5] else []
                except:
                    issues = row[5]
                
                # If they are lists, join them for the frontend
                ww_str = ", ".join(worked_well) if isinstance(worked_well, list) else str(worked_well)
                issues_str = ", ".join(issues) if isinstance(issues, list) else str(issues)

                feedbacks.append({
                    "id": row[0],
                    "user_id": row[1],
                    "chat_id": row[2],
                    "rating": int(row[3]) if row[3] else 0,
                    "worked_well": ww_str,
                    "issues": issues_str,
                    "comments": row[6],
                    "timestamp": str(row[7]) if row[7] else None,
                    "username": row[8] or "Unknown",
                    "email": row[9] or "Unknown"
                })
            return feedbacks
        except Exception as e:
            print(f"Error fetching all feedback: {e}")
            return []

