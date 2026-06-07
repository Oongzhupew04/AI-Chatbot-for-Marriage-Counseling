# services/chat_service.py
from repositories.chat_repo import ChatRepository
from services.risk_alert_service import RiskAlertService
import os
from dotenv import load_dotenv # Added to load your openGauss credentials
from deepseek_ai_cloud import detect_intent, generate_casual_response, is_casual_chat, generate_counseling_response
from langchain_huggingface import HuggingFaceEmbeddings
import re
import logging
from langchain_opengauss import OpenGauss, OpenGaussSettings

# Load environment variables from the .env file
load_dotenv()

class ChatService:
    """Handles chat business logic and session management."""
    
    def __init__(self):
        self.chat_repo = ChatRepository()
        self.risk_alert_service = RiskAlertService()
        print("Booting up RAG Database Engine (Takes ~10-15 seconds)...")
        
        logging.getLogger("transformers.modeling_utils").setLevel(logging.ERROR)
        
        self.embeddings = HuggingFaceEmbeddings(
            model_name="BAAI/bge-large-en-v1.5",
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
        
        # 2. Configure openGauss Settings (Must match your builder script)
        config = OpenGaussSettings(
            host=os.getenv("DB_HOST", "127.0.0.1"),
            port=int(os.getenv("DB_PORT", 5432)), 
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            table_name="counseling_knowledge",
            embedding_dimension=1024,
            index_type="hnsw",
            distance_strategy="euclidean"
        )

        # 3. Connect to the openGauss server
        self.vector_db = OpenGauss(
            embedding=self.embeddings,
            config=config
        )
        
        print("openGauss DataVec Database connected. System ready.\n")
    
    def get_or_create_chat(self, user_id, chat_id):
        """Get existing chat_id or create a new one."""
        if not chat_id:
            chat = self.chat_repo.create_chat(user_id)
            if chat:
                return chat.id
        return chat_id
    
    def log_message(self, chat_id, user_msg, bot_msg):
        """Log a conversation message."""
        return self.chat_repo.log_message(chat_id, user_msg, bot_msg)
    
    def get_chat_history(self, chat_id):
        """Retrieve chat history."""
        return self.chat_repo.get_chat_history(chat_id)
    
    def delete_session(self, chat_id: int):
        """Deletes a specific chat session."""
        return self.chat_repo.delete_user_session(chat_id)
    
    def process_user_message(self, user_id: int, chat_id: int, user_input: str):
        """Orchestrates the entire AI pipeline and returns a dictionary for the router."""
        
        # 1. Frontend Action Check
        if re.search(r'\b(end session|end|bye bye|bye|thank you|thanks)\b', user_input.lower()):
            return {"response": "Are you sure you want to end this session?", "action": "confirm_end", "risk_level": 0}

        # 2. Risk Detection
        crisis_data = self.risk_alert_service.check_and_generate_crisis_response(user_input)
        if crisis_data:
            message_id = self.log_message(chat_id, user_input, crisis_data["response"])
            if message_id:
                self.risk_alert_service.process_risk_alert(
                    user_id, message_id, crisis_data["risk_level"], crisis_data["trigger_keyword"]
                )
            return {
                "response": crisis_data["response"], 
                "action": crisis_data["action"], 
                "risk_level": crisis_data["risk_level"]
            }

        # If no crisis, risk level is 0
        risk_level = 0

        # 3. Intent Detection
        intent_response = detect_intent(user_input)
        if intent_response:
            self.log_message(chat_id, user_input, intent_response)
            return {"response": intent_response, "action": "none", "risk_level": risk_level}

        # 4. Route the message: Casual Chat vs. Counseling Issue
        
        # Fetch recent chat history to give the AI context of the conversation
        history = self.get_chat_history(chat_id)
        # Keep only the last 10 messages to avoid exceeding token limits
        recent_history = history[-10:] if history else []
        
        if is_casual_chat(user_input, recent_history):
            print(f"[Router] chat_id {chat_id}: Detected casual conversation. Bypassing RAG.")
            
            # Use the lightweight casual prompt function
            ai_response = generate_casual_response(user_input, recent_history)
            
        else:
            print(f"[Router] chat_id {chat_id}: Detected relationship issue. Engaging RAG.")
            
            # 5. RAG Retrieval (Notice how this stays EXACTLY the same!)
            # try:
            #     results = self.vector_db.similarity_search(user_input, k=1)
            #     retrieved_context = "\n\n".join([doc.page_content for doc in results])
                
            #     # Handling metadata securely
            #     retrieved_sources = [doc.metadata.get("source", "Unknown file") if doc.metadata else "Unknown file" for doc in results]
            #     print(f"[RAG LOG] chat_id {chat_id} retrieved files: {retrieved_sources}")
                
            # except Exception as e:
            #     print(f"[RAG ERROR] Vector DB Search Error: {e}")
            #     retrieved_context = "" # Failsafe: Continue without context if DB is down

            try:
                results = self.vector_db.similarity_search_with_score(user_input, k=1)
                
                retrieved_context = ""
                
                print(f"\n--- [RAG DIAGNOSTIC: chat_id {chat_id}] ---")
                if results:
                    # Unpack the exact document and score from the first (and only) item
                    doc, score = results[0] 
                    
                    source_file = doc.metadata.get("source", "Unknown file")
                    file_name = os.path.basename(source_file)
                    
                    print(f"Top Match: {file_name}")
                    print(f"Distance Score: {score:.4f}")
                    
                    retrieved_context = doc.page_content
                else:
                    print("No matches found in the database.")
                    
                print("-------------------------------------------\n")
                
            except Exception as e:
                print(f"[RAG ERROR] Vector DB Search Error: {e}")
                retrieved_context = "" # Failsafe

            # 6. Default LLM Response (Using RAG Context)
            ai_response = generate_counseling_response(user_input, retrieved_context, recent_history)

        from deepseek_ai_cloud import CRISIS_RESOURCES
        if CRISIS_RESOURCES in ai_response:
            risk_level = 2
            print("[Router] Post-generation safety filter triggered. Escalating risk_level to 2.")
            
        # 7. Log the interaction (Happens for BOTH casual and clinical paths)
        self.log_message(chat_id, user_input, ai_response)
        
        return {"response": ai_response, "action": "none", "risk_level": risk_level}