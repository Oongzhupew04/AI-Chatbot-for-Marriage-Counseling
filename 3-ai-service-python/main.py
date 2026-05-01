from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn

from services.auth_service import AuthService
from services.chat_service import ChatService
from services.checkin_service import CheckinService
from repositories.chat_repo import ChatRepository
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from typing import List, Optional

load_dotenv()

app = FastAPI(title="AI Compute Service", description="Internal AI Microservice")
auth_service = AuthService()
chat_service = ChatService()
checkin_service = CheckinService()
chat_repository = ChatRepository()

# ==========================================
# --- PYDANTIC MODELS (Data Validation) ---
# ==========================================

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    sex: str
    age: int
    years_married: int
    children_count: int
    children_raised: int
    education: str
    material_situation: str
    religious_affiliation: str
    religiousness: int
    q10: str
    q11: str
    q12: str
    q13: str
    q14: str
    q15: str
    q16: str
    q17: str
    q18: str
    q19: str

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
            "role": user.role
        }
    }

@app.post('/internal/register')
async def internal_register(reg_data: RegisterRequest):
    try:
        # Pass the expanded dictionary or object to your auth_service
        # (You will need to update the register method inside auth_service.py to accept these kwargs)
        user, error = auth_service.register(
            username=reg_data.username,
            email=reg_data.email,
            password=reg_data.password,
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
                "q10": reg_data.q10, "q11": reg_data.q11, "q12": reg_data.q12,
                "q13": reg_data.q13, "q14": reg_data.q14, "q15": reg_data.q15,
                "q16": reg_data.q16, "q17": reg_data.q17, "q18": reg_data.q18,
                "q19": reg_data.q19
            }
        )
        
        if error:
            raise HTTPException(status_code=400, detail=error)
            
        return {"success": True, "message": "User registered successfully"}
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
    result = chat_service.process_user_message(chat_id, user_input)
    
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

if __name__ == '__main__':
    # Run the internal service on port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)