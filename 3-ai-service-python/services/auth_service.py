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

    def calculate_scale_1_score(self, scale_1_data):
            """Sums up q10 to q19 based on text values like '+2', '-1', '0'.etc"""
            total_score = 0
            for question, value in scale_1_data.items():
                try:
                    # Convert to string, strip whitespace, and remove the '+' sign.
                    # Python's int() automatically understands negative signs like '-1'.
                    clean_value = str(value).replace('+', '').strip()
                    total_score += int(clean_value)
                except ValueError:
                    print(f"Warning: Could not parse value '{value}' for {question}")
                    continue
            return total_score
    
    def register(self, username, email, password, demographics, scale_1):
        if self.user_repo.get_by_email(email):
            return None, "Email already registered"
        
        hashed_pw = generate_password_hash(password)
        
        # Calculate the total score for marital satisfaction
        total_scale_1_score = self.calculate_scale_1_score(scale_1)
        
        try:
            # Pass everything to the repository
            self.user_repo.create(
                username=username, 
                email=email, 
                password_hash=hashed_pw,
                demographics=demographics,
                scale_1=scale_1,
                scale_1_score=total_scale_1_score
            )
            return True, "Registration successful"
        except Exception as e:
            return None, f"Error: {e}"