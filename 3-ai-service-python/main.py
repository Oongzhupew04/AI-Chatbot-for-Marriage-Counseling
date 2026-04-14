from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn

from services.auth_service import AuthService
from services.chat_service import ChatService
from repositories.chat_repo import ChatRepository
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from typing import Optional

load_dotenv()

app = FastAPI(title="AI Compute Service", description="Internal AI Microservice")
auth_service = AuthService()
chat_repository = ChatRepository()
chat_service = ChatService()

# ==========================================
# --- PYDANTIC MODELS (Data Validation) ---
# ==========================================

class LoginRequest(BaseModel):
    email: str
    password: str

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
            "email": user.email,
            "role": user.role
        }
    }

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


if __name__ == '__main__':
    # Run the internal service on port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)