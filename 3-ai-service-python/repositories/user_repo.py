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

    def create(self, username, email, password_hash):
        cursor = db.get_connection().cursor()
        cursor.execute("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
                      (username, email, password_hash, 'user'))
        db.get_connection().commit()
        cursor.close()

    def get_by_id(self, user_id):
        # Similar pattern...
        pass