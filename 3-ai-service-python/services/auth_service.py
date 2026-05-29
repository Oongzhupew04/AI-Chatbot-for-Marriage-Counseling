# services/auth_service.py
from werkzeug.security import generate_password_hash, check_password_hash
from repositories.user_repo import UserRepository
from services.email_service import EmailService
import math

class AuthService:
    def __init__(self):
        self.user_repo = UserRepository()
        self.email_service = EmailService()

    def login(self, email, password):
        user = self.user_repo.get_by_email(email)
        if not user:
            return None, "Invalid email or password"
        
        if getattr(user, 'status', 'active') == 'frozen':
            return None, "Your account has been frozen by an administrator. Please contact support."
            
        if not check_password_hash(user.password_hash, password):
            return None, "Invalid email or password"
        
        return user, None

    def generate_registration_otp(self, email: str):
        if self.user_repo.get_by_email(email):
            return False, "Email already registered"
            
        success = self.email_service.generate_and_send_otp(email, email)
        if not success:
            return False, "Failed to send OTP email"
        return True, "OTP sent successfully"

    def generate_otp(self, user_id):
        user = self.user_repo.get_by_id(user_id)
        if not user:
            return False, "User not found"
        
        success = self.email_service.generate_and_send_otp(user_id, user.email)
        if not success:
            return False, "Failed to send OTP email"
        return True, "OTP sent successfully"

    def change_password(self, user_id, current_password, new_password, otp):
        user = self.user_repo.get_by_id(user_id)
        if not user:
            return False, "User not found"
        
        if not check_password_hash(user.password_hash, current_password):
            return False, "Incorrect current password"
            
        if not self.email_service.verify_otp(user_id, otp):
            return False, "Invalid or expired OTP"
            
        hashed_pw = generate_password_hash(new_password)
        success = self.user_repo.update_password(user_id, hashed_pw)
        
        if not success:
            return False, "Failed to update password in database"
            
        return True, "Password updated successfully"

    def request_password_reset_otp(self, email: str):
        # Deliberately do not check if email exists to prevent enumeration
        success = self.email_service.generate_and_send_otp(email, email)
        if not success:
            return False, "Failed to send OTP email"
        return True, "If an account exists, an OTP has been sent."

    def reset_password_via_otp(self, email, otp, new_password):
        user = self.user_repo.get_by_email(email)
        if not user:
            # Mask the exact reason to prevent enumeration
            return False, "User not found or invalid OTP"
            
        if not self.email_service.verify_otp(email, otp):
            return False, "Invalid or expired OTP"
            
        hashed_pw = generate_password_hash(new_password)
        success = self.user_repo.update_password(user.id, hashed_pw)
        
        if not success:
            return False, "Failed to update password in database"
            
        return True, "Password updated successfully"

    def calculate_marital_risk(self, scale_1_data):
        """
        Calculates calibrated marital risk probability based on q13, q17, and q19.
        Returns an integer percentage (0 to 100) where higher = higher risk.
        """
        try:
            # 1. Extract values from the dictionary safely (default to '0' if missing)
            q13_val = scale_1_data.get('q13', '0')
            q17_val = scale_1_data.get('q17', '0')
            q19_val = scale_1_data.get('q19', '0')
            
            # 2. Parse strings (like "+2" or "-1") into integers
            q13 = int(str(q13_val))
            q17 = int(str(q17_val))
            q19 = int(str(q19_val))
            
            # 4. Map to the algorithm's expected variables
            sact = q17     # q17 represents 'sact'
            esteem2 = q13  # q13 represents 'esteem2'
            love1 = q19    # q19 represents 'love1'
            
            # 5. Apply the ms_risk_calibrated formula
            beta0 = 3.64           # Adjusted intercept
            beta1 = -0.487025      # sact coefficient
            beta2 = -0.452113      # esteem2 coefficient
            beta3 = -0.274231      # love1 coefficient
            
            z = beta0 + (beta1 * sact) + (beta2 * esteem2) + (beta3 * love1)
            
            # 6. Calculate Sigmoid for probability (0.0 to 1.0)
            risk_probability = 1 / (1 + math.exp(-z))
            
            # 7. Convert to integer percentage to fit your database column
            risk_percentage = round(risk_probability * 100, 3)
            return risk_percentage
            
        except (ValueError, TypeError) as e:
            print(f"Error calculating risk: {e}")
            return 0 # Default fallback
    
    def register(self, username, email, password, demographics, scale_1, otp):
        if self.user_repo.get_by_email(email):
            return None, "Email already registered"
            
        if not self.email_service.verify_otp(email, otp):
            return None, "Invalid or expired OTP"
        
        hashed_pw = generate_password_hash(password)
        
        # Calculate the total score for marital satisfaction
        marital_risk_percentage = self.calculate_marital_risk(scale_1)
        
        try:
            # Pass everything to the repository
            self.user_repo.create(
                username=username, 
                email=email, 
                password_hash=hashed_pw,
                demographics=demographics,
                scale_1=scale_1,
                marital_risk_percentage=marital_risk_percentage
            )
            
            # Map risk_percentage (0-100) to 1-5 scale for comparison with q20
            if marital_risk_percentage <= 20:
                actual_q20 = 1
            elif marital_risk_percentage <= 40:
                actual_q20 = 2
            elif marital_risk_percentage <= 60:
                actual_q20 = 3
            elif marital_risk_percentage <= 80:
                actual_q20 = 4
            else:
                actual_q20 = 5
                
            expected_q20 = int(scale_1.get("q20", 3))
            
            # Literal comparison as requested, using mapped values for sanity
            dishonesty_detected = (actual_q20 != expected_q20)
            
            return {"success": True, "dishonesty_detected": dishonesty_detected}, None
        except Exception as e:
            return None, f"Error: {e}"