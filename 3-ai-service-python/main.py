from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn
import os
import logging

from services.auth_service import AuthService
from services.chat_service import ChatService
from services.checkin_service import CheckinService
from services.feedback_service import FeedbackService
from repositories.chat_repo import ChatRepository
from repositories.push_subscription_repo import PushSubscriptionRepository
from repositories.user_repo import UserRepository
from repositories.faq_repo import FaqRepository
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from typing import List, Optional
from scheduler import start_scheduler

load_dotenv()
os.environ["TRANSFORMERS_VERBOSITY"] = "error"
logging.getLogger("transformers").setLevel(logging.ERROR)

app = FastAPI(title="AI Compute Service", description="Internal AI Microservice")

@app.on_event("startup")
def on_startup():
    start_scheduler()
    

auth_service = AuthService()
chat_service = ChatService()
checkin_service = CheckinService()
feedback_service = FeedbackService()
chat_repository = ChatRepository()



# ==========================================
# --- PYDANTIC MODELS (Data Validation) ---
# ==========================================

class LoginRequest(BaseModel):
    email: str
    password: str

class ProfileUpdateRequest(BaseModel):
    username: Optional[str] = None
    sex: Optional[str] = None
    age: Optional[int] = None
    years_married: Optional[int] = None
    children_count: Optional[int] = None
    children_raised: Optional[int] = None
    education: Optional[str] = None
    religious_affiliation: Optional[str] = None

class ProfilePicRequest(BaseModel):
    profile_pic: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    otp: str
    sex: str
    age: int
    years_married: int
    children_count: int
    children_raised: int
    education: str
    material_situation: str
    religious_affiliation: str
    religiousness: int
    q13: str
    q17: str
    q19: str
    q20: str

class ChatRequest(BaseModel):
    user_id: int
    chat_id: Optional[int] = None
    message: str

class ChatResponse(BaseModel):
    response: str
    action: str
    risk_level: int

class NewChatRequest(BaseModel):
    user_id: int

class RotationalData(BaseModel):
    question: str
    score: int

class CheckinRequest(BaseModel):
    user_id: int
    coreMetric: int
    rotational: RotationalData
    unmetNeeds: List[str]
    journalEntry: Optional[str] = ""
    timestamp: str

class FeedbackRequest(BaseModel):
    user_id: int
    chatId: Optional[int] = None
    rating: str
    workedWell: List[str]
    issues: List[str]
    comments: str

class PushSubscriptionRequest(BaseModel):
    user_id: int
    endpoint: str
    p256dh: str
    auth: str

class PushPreferenceRequest(BaseModel):
    user_id: int
    enabled: bool

class DarkModePreferenceRequest(BaseModel):
    user_id: int
    enabled: bool

class OTPRequest(BaseModel):
    user_id: int

class ChangePasswordRequest(BaseModel):
    user_id: int
    current_password: str
    new_password: str
    otp: str

class RegistrationOTPRequest(BaseModel):
    email: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str

class NewFaqRequest(BaseModel):
    question: str
    answer: str

class NewResourceRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    category: str
    url: str


# ==========================================
# --- INTERNAL API ROUTES (For Node.js) ---
# ==========================================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print("--- VALIDATION ERROR DETAILS ---")
    print(exc.errors()) # This prints the EXACT field that is failing
    print("--- END ERROR ---")
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

@app.post('/internal/login')
async def internal_login(login_data: LoginRequest):
    """Node.js calls this to verify a password against openGauss."""
    
    # login_data automatically parses the JSON body!
    user, error = auth_service.login(login_data.email, login_data.password)
    
    if error:
        # FastAPI way to handle errors (replaces Flask's 401 tuple)
        raise HTTPException(status_code=401, detail=error)
    
    # FastAPI automatically converts standard Python dictionaries to JSON (replaces jsonify)
    return {
        "success": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "dark_mode_enabled": user.dark_mode_enabled
        }
    }

@app.post('/internal/register')
async def internal_register(reg_data: RegisterRequest):
    try:
        # Pass the expanded dictionary or object to your auth_service
        # (You will need to update the register method inside auth_service.py to accept these kwargs)
        result, error = auth_service.register(
            username=reg_data.username,
            email=reg_data.email,
            password=reg_data.password,
            otp=reg_data.otp,
            demographics={
                "sex": reg_data.sex,
                "age": reg_data.age,
                "years_married": reg_data.years_married,
                "children_count": reg_data.children_count,
                "children_raised": reg_data.children_raised,
                "education": reg_data.education,
                "material_situation": reg_data.material_situation,
                "religious_affiliation": reg_data.religious_affiliation,
                "religiousness": reg_data.religiousness
            },
            scale_1={
                "q13": reg_data.q13, "q17": reg_data.q17, "q19": reg_data.q19, "q20": reg_data.q20
            }
        )
        
        if error:
            raise HTTPException(status_code=400, detail=error)
            
        return {
            "success": True, 
            "message": "User registered successfully", 
            "dishonesty_detected": result.get("dishonesty_detected", False)
        }
    except Exception as e:
        print(f"Registration Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to register user in database")

@app.post('/internal/new_chat')
async def new_chat(data: NewChatRequest):
    try:
        # 1. Ask the service/repo to create the row in the database
        new_id = chat_service.get_or_create_chat(data.user_id, None)
        
        # 2. Return the official database ID to Node.js
        return {"status": "success", "chat_id": new_id}
    except Exception as e:
        print(f"Database Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create chat in database")


@app.post("/internal/get_response", response_model=ChatResponse)
async def process_chat(chat_data: ChatRequest):
    """
    Internal endpoint called ONLY by the Node.js Gateway.
    """
    user_input = chat_data.message.strip()
    chat_id = chat_data.chat_id

    # The service handles ALL the heavy lifting!
    result = chat_service.process_user_message(chat_data.user_id, chat_id, user_input)
    
    # We just return the Pydantic model
    return ChatResponse(
        response=result["response"],
        action=result["action"],
        risk_level=result["risk_level"]
    )

@app.get('/internal/users/{user_id}/chats')
async def get_user_chats(user_id: int):
    sessions = chat_service.chat_repo.get_user_sessions(user_id)
    return {"sessions": sessions}

@app.delete('/internal/chats/{chat_id}')
async def delete_chat(chat_id: int):
    """Deletes a chat session from the database."""
    success = chat_service.delete_session(chat_id)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete chat session")
        
    return {"success": True, "message": "Chat deleted successfully"}

@app.post('/internal/chats/{chat_id}/end')
async def end_chat_session(chat_id: int):
    """Logs a system message indicating the session was ended by the user."""
    success = chat_service.log_message(chat_id, "[Request End Session]", "[Session Ended]")
    if not success:
         raise HTTPException(status_code=500, detail="Failed to log session end")
    return {"success": True}

@app.get('/internal/chats/{chat_id}/messages')
async def get_messages(chat_id: int):
    messages = chat_service.chat_repo.get_chat_history(chat_id)
    return {"messages": messages}

@app.post('/internal/checkin')
async def handle_checkin(data: CheckinRequest):
    try:
        # Pass the validated Pydantic object directly to the service
        result = checkin_service.process_daily_checkin(data)
        
        return {"success": True, "data": result}
    except Exception as e:
        print(f"Check-in Processing Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process check-in")

@app.post('/internal/feedback')
async def handle_feedback(data: FeedbackRequest):
    try:
        print(f"Received feedback from user {data.user_id} for chat {data.chatId}: {data.rating} stars")
        result = feedback_service.process_feedback(data)
        if not result:
            raise HTTPException(status_code=500, detail="Failed to save feedback to database")
        return {"success": True, "message": "Feedback saved successfully"}
    except Exception as e:
        print(f"Feedback Processing Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process feedback")


@app.get('/internal/users/{user_id}/analysis')
async def get_analysis(user_id: int):
    try:
        user = auth_service.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        baseline = {
            "maritalRiskPercentage": float(getattr(user, 'marital_risk_percentage', 0) or 0),
            "q13": int(getattr(user, 'q13', 0) or 0),
            "q17": int(getattr(user, 'q17', 0) or 0),
            "q19": int(getattr(user, 'q19', 0) or 0),
        }
        
        checkins = checkin_service.repo.get_recent_checkins(user_id, limit=7)
        
        return {
            "baseline": baseline,
            "checkins": checkins
        }
    except Exception as e:
        import traceback
        print(f"Error fetching analysis:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to fetch analysis data")

@app.post('/internal/settings/push-subscription')
async def save_push_subscription(data: PushSubscriptionRequest):
    repo = PushSubscriptionRepository()
    success = repo.save_subscription(data.user_id, data.endpoint, data.p256dh, data.auth)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save push subscription")
    return {"success": True}

@app.delete('/internal/settings/push-subscription')
async def delete_push_subscription(endpoint: str):
    repo = PushSubscriptionRepository()
    success = repo.delete_subscription(endpoint)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete push subscription")
    return {"success": True}

@app.get('/internal/settings/preferences/{user_id}')
async def get_preferences(user_id: int):
    repo = UserRepository()
    user = repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "success": True,
        "push_notifications_enabled": getattr(user, 'push_notifications_enabled', False),
        "dark_mode_enabled": getattr(user, 'dark_mode_enabled', False)
    }

@app.put('/internal/settings/preferences')
async def update_push_preferences(data: PushPreferenceRequest):
    repo = UserRepository()
    success = repo.update_push_preferences(data.user_id, data.enabled)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update preferences")
    return {"success": True}

@app.put('/internal/settings/darkmode')
async def update_dark_mode_preferences(data: DarkModePreferenceRequest):
    repo = UserRepository()
    success = repo.update_dark_mode_preference(data.user_id, data.enabled)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update dark mode preferences")
    return {"success": True}

@app.post('/internal/settings/request-otp')
async def request_otp(data: OTPRequest):
    success, message = auth_service.generate_otp(data.user_id)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"success": True, "message": message}

@app.post('/internal/request-registration-otp')
async def request_registration_otp(data: RegistrationOTPRequest):
    success, message = auth_service.generate_registration_otp(data.email)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"success": True, "message": message}

@app.post('/internal/forgot-password')
async def forgot_password(data: ForgotPasswordRequest):
    success, message = auth_service.request_password_reset_otp(data.email)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"success": True, "message": message}

@app.post('/internal/reset-password')
async def reset_password(data: ResetPasswordRequest):
    success, message = auth_service.reset_password_via_otp(data.email, data.otp, data.new_password)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"success": True, "message": message}

@app.put('/internal/settings/change-password')
async def change_password(data: ChangePasswordRequest):
    success, message = auth_service.change_password(
        data.user_id, data.current_password, data.new_password, data.otp
    )
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"success": True, "message": message}

@app.get('/internal/faq')
async def get_faqs():
    repo = FaqRepository()
    faqs = repo.get_all_faqs()
    # Serialize objects to dict
    faq_list = [{"id": f.id, "question": f.question, "answer": f.answer} for f in faqs]
    return {"success": True, "faqs": faq_list}

@app.get('/internal/users/{user_id}/profile')
async def get_user_profile(user_id: int):
    repo = UserRepository()
    user = repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {
        "success": True,
        "profile": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "sex": getattr(user, 'sex', None),
            "age": getattr(user, 'age', None),
            "years_married": getattr(user, 'years_married', None),
            "children_count": getattr(user, 'children_count', None),
            "children_raised": getattr(user, 'children_raised', None),
            "education": getattr(user, 'education', None),
            "religious_affiliation": getattr(user, 'religious_affiliation', None),
            "profile_pic": getattr(user, 'profile_pic', None)
        }
    }

@app.put('/internal/users/{user_id}/profile')
async def update_user_profile(user_id: int, data: ProfileUpdateRequest):
    repo = UserRepository()
    # Ensure user exists
    user = repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    repo.update_profile(user_id, data.dict(exclude_unset=True))
    return {"success": True}

@app.put('/internal/users/{user_id}/profile-pic')
async def update_user_profile_pic(user_id: int, data: ProfilePicRequest):
    repo = UserRepository()
    user = repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    repo.update_profile_pic(user_id, data.profile_pic)
    return {"success": True}

@app.delete('/internal/users/{user_id}')
async def delete_user_account(user_id: int):
    repo = UserRepository()
    user = repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    success = repo.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete user account")
    
    return {"success": True}

@app.get('/internal/resources')
async def get_resources():
    from repositories.resource_repo import ResourceRepository
    repo = ResourceRepository()
    resources = repo.get_all_resources()
    return {"success": True, "resources": [r.__dict__ for r in resources]}

# ==========================================
# --- ADMIN ROUTES ---
# ==========================================
from services.admin_dashboard_service import AdminDashboardService
from services.admin_high_risk_service import AdminHighRiskService
from services.admin_feedback_service import AdminFeedbackService

admin_dashboard_service = AdminDashboardService()
admin_high_risk_service = AdminHighRiskService()
admin_feedback_service = AdminFeedbackService()

@app.get('/internal/admin/stats')
async def get_admin_stats():
    try:
        stats = admin_dashboard_service.get_dashboard_stats()
        return {"success": True, "stats": stats}
    except Exception as e:
        print(f"Error fetching admin stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch admin stats")

@app.get('/internal/admin/incidents')
async def get_admin_incidents():
    try:
        incidents = admin_high_risk_service.get_recent_incidents()
        return {"success": True, "incidents": incidents}
    except Exception as e:
        print(f"Error fetching admin incidents: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch admin incidents")

@app.get('/internal/admin/feedbacks')
async def get_admin_feedbacks():
    try:
        feedbacks = admin_feedback_service.get_all_feedback()
        return {"success": True, "feedbacks": feedbacks}
    except Exception as e:
        print(f"Error fetching admin feedbacks: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch admin feedbacks")

@app.get('/internal/admin/incidents/all')
async def get_all_admin_incidents():
    try:
        incidents = admin_high_risk_service.get_all_incidents()
        return {"success": True, "incidents": incidents}
    except Exception as e:
        print(f"Error fetching all admin incidents: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch all admin incidents")

@app.put('/internal/admin/incidents/{incident_id}/resolve')
async def admin_resolve_incident(incident_id: int):
    try:
        success, message = admin_high_risk_service.resolve_incident(incident_id)
        if not success:
            raise HTTPException(status_code=400, detail=message)
        return {"success": True, "message": message}
    except Exception as e:
        print(f"Error resolving incident: {e}")
        raise HTTPException(status_code=500, detail="Failed to resolve incident")


class ContactUserRequest(BaseModel):
    user_id: int
    message: str

@app.post('/internal/admin/incidents/{incident_id}/contact')
async def admin_contact_user(incident_id: int, data: ContactUserRequest):
    try:
        success, message = admin_high_risk_service.send_high_risk_email(data.user_id, data.message)
        if not success:
            raise HTTPException(status_code=400, detail=message)
        return {"success": True, "message": message}
    except Exception as e:
        print(f"Error contacting user: {e}")
        raise HTTPException(status_code=500, detail="Failed to send email to user")

@app.get('/internal/admin/users')
async def get_admin_users():
    try:
        users = admin_dashboard_service.get_user_management_data()
        return {"success": True, "users": users}
    except Exception as e:
        print(f"Error fetching admin users: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch admin users")

@app.put('/internal/admin/users/{user_id}/freeze')
async def admin_freeze_user(user_id: int):
    try:
        success, message = admin_dashboard_service.freeze_user(user_id)
        if not success:
            raise HTTPException(status_code=400, detail=message)
        return {"success": True, "status": message}
    except Exception as e:
        print(f"Error freezing user: {e}")
        raise HTTPException(status_code=500, detail="Failed to freeze/unfreeze user")

@app.post('/internal/admin/users/{user_id}/reset-password')
async def admin_reset_password(user_id: int):
    try:
        success, message = admin_dashboard_service.reset_user_password(user_id)
        if not success:
            raise HTTPException(status_code=400, detail=message)
        return {"success": True, "message": message}
    except Exception as e:
        print(f"Error resetting password: {e}")
        raise HTTPException(status_code=500, detail="Failed to reset password")

@app.delete('/internal/admin/users/{user_id}')
async def admin_delete_user(user_id: int):
    repo = UserRepository()
    user = repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    success = repo.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete user account")
    
    return {"success": True}

@app.post('/internal/admin/resources')
async def admin_add_resource(data: NewResourceRequest):
    from repositories.resource_repo import ResourceRepository
    repo = ResourceRepository()
    
    # Auto-generate icon based on category
    icon_map = {
        "article": "fas fa-newspaper",
        "pdf": "fas fa-file-pdf",
        "video": "fas fa-video",
    }
    icon = icon_map.get(data.category, "fas fa-link")
    description = data.description if data.description else "No description provided."
    
    success, message = repo.add_resource(data.title, description, data.category, data.url, icon)
    if not success:
        raise HTTPException(status_code=500, detail=message)
    return {"success": True, "message": message}

@app.delete('/internal/admin/resources/{resource_id}')
async def admin_delete_resource(resource_id: int):
    from repositories.resource_repo import ResourceRepository
    repo = ResourceRepository()
    success, message = repo.delete_resource(resource_id)
    if not success:
        raise HTTPException(status_code=500, detail=message)
    return {"success": True, "message": message}

@app.post('/internal/admin/faqs')
async def admin_add_faq(data: NewFaqRequest):
    repo = FaqRepository()
    success, message = repo.add_faq(data.question, data.answer)
    if not success:
        raise HTTPException(status_code=500, detail=message)
    return {"success": True, "message": message}

if __name__ == '__main__':
    # Run the internal service on port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)