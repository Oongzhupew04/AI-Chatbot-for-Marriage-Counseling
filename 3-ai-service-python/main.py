from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn

from services.auth_service import AuthService
from services.chat_service import ChatService
from repositories.chat_repo import ChatRepository
from deepseek_ai_cloud import analyze_risk, detect_intent, generate_response, CRISIS_RESOURCES
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

    if "end session" in user_input.lower():
        return ChatResponse(
            response="Are you sure you want to end this session?",
            action="confirm_end",
            risk_level=0
        )
    
    # 1. Risk detection (Highest Priority)
    risk_level = analyze_risk(user_input)
    if risk_level >= 1:
        urgency = "high" if risk_level == 2 else "moderate"
        bot_reply = f"I am hearing that you are in a very distressing and potentially unsafe situation. {CRISIS_RESOURCES}"
        if urgency == "high":
            bot_reply += "\n*Please* reach out to someone for physical support right now."
        
        # Log to your database (openGauss) via ChatService
        chat_service.log_message(chat_id, user_input, "[CRISIS INTERVENTION TRIGGERED]", risk_level)
        return ChatResponse(response=bot_reply, action="none", risk_level=risk_level)

    # 2. Intent/mood detection
    intent_response = detect_intent(user_input)
    if intent_response:
        chat_service.log_message(chat_id, user_input, intent_response, risk_level)
        return ChatResponse(response=intent_response, action="none", risk_level=risk_level)

    # 3. Default LLM response (Sending to Huawei ECS)
    system_msg = (
        "You are a professional, empathetic, and neutral marriage counselor. "
        "Provide constructive advice, validate feelings, and encourage healthy communication between partners. "
        "Do not take sides. Keep your responses concise and conversational.\n\n"
    )
    full_prompt = f"{system_msg}User: {user_input}\nCounselor:"
    
    # Call ECS server
    ai_response = generate_response(full_prompt)
    
    # Log successful AI response
    chat_service.log_message(chat_id, user_input, ai_response, risk_level)

    return ChatResponse(response=ai_response, action="none", risk_level=risk_level)


if __name__ == '__main__':
    # Run the internal service on port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)