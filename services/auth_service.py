# services/auth_service.py
from werkzeug.security import generate_password_hash, check_password_hash
from repositories.user_repo import UserRepository

class AuthService:
    def __init__(self):
        self.user_repo = UserRepository()

    def login(self, email, password):
        user = self.user_repo.get_by_email(email)
        if not user:
            return None, "Invalid email or password"
        
        if not check_password_hash(user.password_hash, password):
            return None, "Invalid email or password"
        
        return user, None

    def register(self, username, email, password):
        if self.user_repo.get_by_email(email):
            return None, "Email already registered"
        
        hashed_pw = generate_password_hash(password)
        try:
            self.user_repo.create(username, email, hashed_pw)
            return True, "Registration successful"
        except Exception as e:
            return None, f"Error: {e}"