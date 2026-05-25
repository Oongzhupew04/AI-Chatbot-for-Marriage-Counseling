import smtplib
import random
import time
import os
from email.message import EmailMessage

class EmailService:
    def __init__(self):
        # We store OTPs in memory for now: { user_id: { "otp": "123456", "expires_at": <timestamp> } }
        self.otp_store = {}

    def generate_and_send_otp(self, user_identifier: str | int, user_email: str) -> bool:
        # Generate a 6-digit OTP
        otp = str(random.randint(100000, 999999))
        
        # Store OTP with a 10-minute expiration
        self.otp_store[str(user_identifier)] = {
            "otp": otp,
            "expires_at": time.time() + 600  # 10 minutes from now
        }
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", 587))
        smtp_user = os.getenv("SMTP_USER")
        smtp_pass = os.getenv("SMTP_PASS")
        
        try:
            msg = EmailMessage()
            msg.set_content(f"Your verification code is {otp}. It expires in 10 minutes.")
            msg['Subject'] = 'Your Verification Code - AI Marriage Counseling'
            msg['From'] = smtp_user
            msg['To'] = user_email
            
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
                
            print(f"Successfully sent OTP email to {user_email}")
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False

    def verify_otp(self, user_identifier: str | int, otp_input: str) -> bool:
        uid = str(user_identifier)
        record = self.otp_store.get(uid)
        if not record:
            return False
            
        if time.time() > record["expires_at"]:
            del self.otp_store[uid]
            return False
            
        if record["otp"] == otp_input:
            del self.otp_store[uid]
            return True
            
        return False
