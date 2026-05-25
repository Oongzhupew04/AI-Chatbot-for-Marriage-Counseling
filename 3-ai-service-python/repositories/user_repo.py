# repositories/user_repo.py
from database import db
from models.user import User

class UserRepository:
    def get_by_email(self, email):
        cursor = db.get_connection().cursor()
        cursor.execute("SELECT id, username, email, password, role FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        cursor.close()
        if row:
            return User(row[0], row[1], row[2], row[3], row[4])
        return None

    def create(self, username, email, password_hash, demographics, scale_1, marital_risk_percentage):
        cursor = db.get_connection().cursor()
        
        query = """
            INSERT INTO users (
                username, email, password, role,
                sex, age, years_married, children_count, children_raised,
                education, material_situation, religious_affiliation, religiousness,
                q13, q17, q19, q20, marital_risk_percentage
            ) VALUES (
                ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?, ?
            )
        """
        
        values = (
            username, email, password_hash, 'user',
            # Demographics
            demographics.get('sex'), demographics.get('age'), demographics.get('years_married'),
            demographics.get('children_count'), demographics.get('children_raised'), 
            demographics.get('education'), demographics.get('material_situation'), 
            demographics.get('religious_affiliation'), demographics.get('religiousness'),
            # Scale 1 Text Values
            scale_1.get('q13'), scale_1.get('q17'), scale_1.get('q19'), scale_1.get('q20'),
            # Calculated Final Score
            marital_risk_percentage
        )
        
        cursor.execute(query, values)
        db.get_connection().commit()
        cursor.close()

    def get_by_id(self, user_id):
        cursor = db.get_connection().cursor()
        
        # Explicitly listing columns ensures row[0], row[1], etc., are always exactly what we expect
        query = """
            SELECT 
                id, username, email, password, role,
                sex, age, years_married, children_count, children_raised,
                education, material_situation, religious_affiliation, religiousness,
                q13, q17, q19, q20, marital_risk_percentage, push_notifications_enabled, dark_mode_enabled, profile_pic
            FROM users 
            WHERE id = ?
        """
        
        cursor.execute(query, (user_id,))
        row = cursor.fetchone()
        cursor.close()
        
        if row:
            # Map the tuple back into the User model using explicit keyword arguments
            return User(
                id=row[0],
                username=row[1],
                email=row[2],
                password_hash=row[3],
                role=row[4],
                # Demographics
                sex=row[5],
                age=row[6],
                years_married=row[7],
                children_count=row[8],
                children_raised=row[9],
                education=row[10],
                material_situation=row[11],
                religious_affiliation=row[12],
                religiousness=row[13],
                # Scale 1 Text Values & Score (These will be caught by **kwargs in the User model)
                q13=row[14], 
                q17=row[15], 
                q19=row[16], 
                q20=row[17],
                marital_risk_percentage=row[18],
                push_notifications_enabled=bool(row[19]) if len(row) > 19 and row[19] is not None else False,
                dark_mode_enabled=bool(row[20]) if len(row) > 20 and row[20] is not None else False,
                profile_pic=row[21] if len(row) > 21 else None
            )
            
        return None

    def update_profile(self, user_id, profile_data):
        cursor = db.get_connection().cursor()
        query = """
            UPDATE users SET 
                username = ?, sex = ?, age = ?, years_married = ?, 
                children_count = ?, children_raised = ?, education = ?, 
                religious_affiliation = ?
            WHERE id = ?
        """
        values = (
            profile_data.get('username'),
            profile_data.get('sex'),
            profile_data.get('age'),
            profile_data.get('years_married'),
            profile_data.get('children_count'),
            profile_data.get('children_raised'),
            profile_data.get('education'),
            profile_data.get('religious_affiliation'),
            user_id
        )
        cursor.execute(query, values)
        db.get_connection().commit()
        cursor.close()

    def update_profile_pic(self, user_id, pic_url):
        cursor = db.get_connection().cursor()
        query = "UPDATE users SET profile_pic = ? WHERE id = ?"
        cursor.execute(query, (pic_url, user_id))
        db.get_connection().commit()
        cursor.close()

    def update_push_preferences(self, user_id, enabled):
        cursor = db.get_connection().cursor()
        try:
            cursor.execute("UPDATE users SET push_notifications_enabled = ? WHERE id = ?", (enabled, user_id))
            db.get_connection().commit()
            return True
        except Exception as e:
            db.get_connection().rollback()
            print(f"Error updating push preferences: {e}")
            return False
        finally:
            cursor.close()

    def update_dark_mode_preference(self, user_id, enabled):
        cursor = db.get_connection().cursor()
        try:
            cursor.execute("UPDATE users SET dark_mode_enabled = ? WHERE id = ?", (enabled, user_id))
            db.get_connection().commit()
            return True
        except Exception as e:
            db.get_connection().rollback()
            print(f"Error updating dark mode preferences: {e}")
            return False
        finally:
            cursor.close()

    def get_users_with_push_enabled(self):
        cursor = db.get_connection().cursor()
        try:
            cursor.execute("SELECT id FROM users WHERE push_notifications_enabled = TRUE;")
            rows = cursor.fetchall()
            return [row[0] for row in rows]
        except Exception as e:
            print(f"Error fetching users with push enabled: {e}")
            return []
        finally:
            cursor.close()

    def update_password(self, user_id, password_hash):
        cursor = db.get_connection().cursor()
        try:
            cursor.execute("UPDATE users SET password = ? WHERE id = ?", (password_hash, user_id))
            db.get_connection().commit()
            return True
        except Exception as e:
            db.get_connection().rollback()
            print(f"Error updating password: {e}")
            return False
        finally:
            cursor.close()

    def delete_user(self, user_id):
        cursor = db.get_connection().cursor()
        try:
            # Delete related data first to prevent foreign key constraint violations
            cursor.execute("DELETE FROM chats WHERE user_id = ?", (user_id,))
            cursor.execute("DELETE FROM daily_checkins WHERE user_id = ?", (user_id,))
            cursor.execute("DELETE FROM push_subscriptions WHERE user_id = ?", (user_id,))
            cursor.execute("DELETE FROM risk_alerts WHERE user_id = ?", (user_id,))
            cursor.execute("DELETE FROM feedback WHERE user_id = ?", (user_id,))
            
            # Delete the user
            cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
            
            db.get_connection().commit()
            return True
        except Exception as e:
            db.get_connection().rollback()
            print(f"Error deleting user: {e}")
            return False
        finally:
            cursor.close()