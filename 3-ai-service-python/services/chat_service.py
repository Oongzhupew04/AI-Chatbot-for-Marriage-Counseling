# services/chat_service.py
from repositories.chat_repo import ChatRepository
import os
from deepseek_ai_cloud import analyze_risk, detect_intent, generate_casual_response, is_casual_chat, generate_counseling_response, CRISIS_RESOURCES
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

class ChatService:
    """Handles chat business logic and session management."""
    
    def __init__(self):
        self.chat_repo = ChatRepository()
        print("Booting up RAG Database Engine (Takes ~10-15 seconds)...")
        self.embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'}
        )
        self.vector_db = Chroma(
            persist_directory="chroma_db", 
            embedding_function=self.embeddings
        )
        print("Chroma Database loaded. System ready.\n")
    
    def get_or_create_chat(self, user_id, chat_id):
        """Get existing chat_id or create a new one."""
        if not chat_id:
            chat = self.chat_repo.create_chat(user_id)
            if chat:
                return chat.id
        return chat_id
    
    def log_message(self, chat_id, user_msg, bot_msg, risk_level):
        """Log a conversation message."""
        return self.chat_repo.log_message(chat_id, user_msg, bot_msg, risk_level)
    
    def get_chat_history(self, chat_id):
        """Retrieve chat history."""
        return self.chat_repo.get_chat_history(chat_id)
    
    def process_user_message(self, chat_id: int, user_input: str):
        """Orchestrates the entire AI pipeline and returns a dictionary for the router."""
        
        # 1. Frontend Action Check
        if "end session" in user_input.lower():
            return {"response": "Are you sure you want to end this session?", "action": "confirm_end", "risk_level": 0}

        # 2. Risk Detection
        risk_level = analyze_risk(user_input)
        if risk_level >= 1:
            urgency = "high" if risk_level == 2 else "moderate"
            bot_reply = f"I am hearing that you are in a very distressing and potentially unsafe situation. {CRISIS_RESOURCES}"
            if urgency == "high":
                bot_reply += "\n*Please* reach out to someone for physical support right now."
            
            self.log_message(chat_id, user_input, "[CRISIS INTERVENTION TRIGGERED]", risk_level)
            return {"response": bot_reply, "action": "none", "risk_level": risk_level}

        # 3. Intent Detection
        intent_response = detect_intent(user_input)
        if intent_response:
            self.log_message(chat_id, user_input, intent_response, risk_level)
            return {"response": intent_response, "action": "none", "risk_level": risk_level}

        # 4. Route the message: Casual Chat vs. Counseling Issue
        if is_casual_chat(user_input):
            print(f"[Router] chat_id {chat_id}: Detected casual conversation. Bypassing RAG.")
            
            # Use the lightweight casual prompt function
            ai_response = generate_casual_response(user_input)
            
        else:
            print(f"[Router] chat_id {chat_id}: Detected relationship issue. Engaging RAG.")
            
            # 5. RAG Retrieval (Only runs for actual issues)
            try:
                results = self.vector_db.similarity_search(user_input, k=2)
                retrieved_context = "\n\n".join([doc.page_content for doc in results])
                retrieved_sources = [doc.metadata.get("source", "Unknown file") for doc in results]
                print(f"[RAG LOG] chat_id {chat_id} retrieved files: {retrieved_sources}")
                
            except Exception as e:
                print(f"[RAG ERROR] Vector DB Search Error: {e}")
                retrieved_context = "" # Failsafe: Continue without context if DB is down

            # 6. Default LLM Response (Using RAG Context)
            ai_response = generate_counseling_response(user_input, retrieved_context)

        # 7. Log the interaction (Happens for BOTH casual and clinical paths)
        self.log_message(chat_id, user_input, ai_response, risk_level)
        
        return {"response": ai_response, "action": "none", "risk_level": risk_level}