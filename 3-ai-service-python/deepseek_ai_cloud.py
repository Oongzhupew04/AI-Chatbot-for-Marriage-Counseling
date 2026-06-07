import requests
import re
import json
import spacy
from sentence_transformers import SentenceTransformer, util
import torch
import logging

nlp = spacy.load("en_core_web_sm")

logging.getLogger("transformers.modeling_utils").setLevel(logging.ERROR)

print("Booting up Semantic Risk Analyzer Model...")
# Load BGE-Large model for highly accurate risk vector matching (Unified with RAG)
try:
    risk_model = SentenceTransformer("BAAI/bge-large-en-v1.5")
except:
    risk_model = None # Fallback

HIGH_RISK_ANCHORS = [
    "I want to end my life",
    "I am going to kill myself",
    "I don't want to be here anymore",
    "My partner is hurting me physically",
    "I am terrified of my spouse hitting me",
    "I want to file for a divorce right now",
    "I don't want my husband to live",
    "I want my partner to die",
    "I am going to hurt my spouse"
]

if risk_model:
    anchor_embeddings = risk_model.encode(HIGH_RISK_ANCHORS, convert_to_tensor=True)
else:
    anchor_embeddings = None


# --- CONFIGURATION ---
# --- OLD OLLAMA CONFIG (Commented out) ---
# OLLAMA_API_URL = "http://127.0.0.1:11434/api/chat"
# MODEL_NAME = "deepseek-r1:1.5b"

# --- NEW GROQ API CONFIG ---
GROQ_API_KEY = "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"  # <-- PASTE YOUR GROQ API KEY HERE
API_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL_NAME = "llama-3.3-70b-versatile" # Much smarter and incredibly fast on Groq

# --- CONSTANTS ---
CRISIS_RESOURCES = (
    "\nIf you or your partner are in immediate danger, or experiencing a crisis, "
    "please contact local emergency services. In Malaysia, please reach out to Talian Kasih at 15999 or Befrienders Malaysia at 03-76272929."
)

# Marriage Counseling Specific Keywords
KEYWORD_RESPONSES = {
    "affair": "Dealing with infidelity is incredibly painful and complex. It's important to process these emotions safely. How are you holding up?",
    "cheating": "Trust is the foundation of a relationship, and feeling it has been broken is devastating. Would you like to talk about what happened?",
    "finances": "Money is one of the most common stressors in a marriage. Maybe we can explore how you both communicate about financial goals.",
    "abuse": "Your safety is the absolute highest priority. No one deserves to feel unsafe in their relationship. " + CRISIS_RESOURCES,
}

# Unsafe keywords (Self-harm and severe escalation)
UNSAFE_PATTERNS = [
    r"\bcut\b.*\byourself\b", r"\bself[\s-]?harm\b", r"\bkill\b.*\byourself\b", r"\bdie\b", r"\bsuicide\b",
    r"\boverdose\b", r"\bhang\b.*\byourself\b", r"\bend\b.*\blife\b",
    r"\bharm\b.*\byourself\b", r"\bpunish\b.*\byourself\b", r"\bhit\b.*\bme\b", r"\bbeat\b.*\bme\b",
    r"\bdivorce\b", r"\blegal\b.*\bproceedings\b"
]

def is_unsafe(text):
    """Check if text contains unsafe content."""
    text_lower = text.lower()
    return any(re.search(pattern, text_lower) for pattern in UNSAFE_PATTERNS)

def anonymize_pii(text: str) -> str:
    """
    Zero-trust PII Anonymization Layer to adhere to PDPA guidelines.
    Uses SpaCy for unstructured data (Names, Locations, Orgs) and Regex for structured data.
    """
    if not text:
        return text
        
    # SpaCy NLP for Unstructured PII (Names, Organizations, Locations)
    if nlp:
        doc = nlp(text)
        # We must replace entities from end to start to not mess up character indices
        ents = sorted(doc.ents, key=lambda x: x.start_char, reverse=True)
        for ent in ents:
            if ent.label_ == "PERSON":
                text = text[:ent.start_char] + "[REDACTED_NAME]" + text[ent.end_char:]
            elif ent.label_ in ["GPE", "LOC", "FAC"]:
                text = text[:ent.start_char] + "[REDACTED_LOCATION]" + text[ent.end_char:]
            elif ent.label_ == "ORG":
                text = text[:ent.start_char] + "[REDACTED_ORG]" + text[ent.end_char:]
    # Malaysian NRIC (e.g., 900101-14-5566 or 900101145566)
    text = re.sub(r'\b\d{6}-?\d{2}-?\d{4}\b', '[REDACTED_NRIC]', text)
    
    # Email addresses
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[REDACTED_EMAIL]', text)
    
    # Phone numbers (Malaysian and international basic) e.g., +60123456789, 012-3456789
    text = re.sub(r'(\+?6?01[0-46-9]-?\d{7,8}|\+?6?0[2-9]-?\d{7,8})', '[REDACTED_PHONE]', text)
    
    # Credit Card Numbers (Basic 16 digit check)
    text = re.sub(r'\b(?:\d{4}[ -]?){3}\d{4}\b', '[REDACTED_CARD]', text)
    
    return text

def detect_intent(text):
    """Detect user intent/keywords and suggest tailored responses."""
    text_lower = text.lower()
    for keyword, response in KEYWORD_RESPONSES.items():
        if keyword in text_lower:
            return response
    return None

def is_casual_chat(user_msg, history=None):
    """
    Returns True if CASUAL, False if COUNSELING.
    Uses the Groq LLM (Llama-3 8B) to intelligently classify the intent based on context.
    """
    if history is None:
        history = []
        
    system_msg = """You are an intent classification engine for a marriage counseling AI. 
Classify the user's latest message into one of two categories:
1. "CASUAL" - Small talk, greetings, expressing gratitude, or saying goodbye.
2. "COUNSELING" - Discussing relationship issues, emotions, asking for advice, or describing a situation.

Context is important. If the user says "Good", and the AI previously asked "How are you?", it is CASUAL. If the AI previously asked "How did that argument make you feel?", it is COUNSELING.

Respond with exactly ONE WORD: either CASUAL or COUNSELING. Do not include any punctuation or extra text."""

    messages = [{"role": "system", "content": system_msg}]
    
    # We only need the last 4 messages for context to keep it blazing fast
    recent_context = history[-4:] if history else []
    for msg in recent_context:
        role = "user" if msg.get("sender") == "user" else "assistant"
        content = msg.get("text", "")
        # Apply Zero-Trust PII Anonymization to user history
        if role == "user":
            content = anonymize_pii(content)
        messages.append({"role": role, "content": content})
        
    # Apply Zero-Trust PII Anonymization to current input
    messages.append({"role": "user", "content": anonymize_pii(user_msg)})
    
    payload = {
        "model": MODEL_NAME, # Use the proven working model
        "messages": messages,
        "temperature": 0.0,
        "max_tokens": 5 
    }
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(API_URL, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        classification = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip().upper()
        
        # Strip out any markdown or extra tokens just in case
        classification = classification.replace('*', '').replace('.', '')
        
        print(f"[CLASSIFIER LOG] Message: '{user_msg}' | Result: {classification}")
        return classification == "CASUAL"
        
    except requests.exceptions.RequestException as e:
        error_details = ""
        if hasattr(e, 'response') and e.response is not None:
            error_details = f" | Details: {e.response.text}"
        print(f"[CLASSIFIER ERROR] API failed, falling back to heuristic: {e}{error_details}")
        
        # Fallback to simple heuristic
        msg_lower = user_msg.lower().strip()
        casual_phrases = ["hi", "hello", "hey", "how are you", "good morning", "good afternoon", "good evening", "thanks", "thank you", "who are you", "bye", "goodbye", "see you"]
        if msg_lower in casual_phrases: return True
        words = msg_lower.split()
        if len(words) <= 5 and any(phrase in msg_lower for phrase in casual_phrases): return True
        return False

def analyze_risk(text):
    """
    Hybrid Risk Assessment:
    1. Deterministic keyword matching (Regex/Lists) for strict compliance.
    2. Probabilistic semantic vector matching for nuanced, high-risk intents.
    Returns (risk_level, trigger_keyword).
    """
    text_lower = text.lower()
    
    # --- 1. Deterministic Keyword Blacklist (Strict) ---
    high_risk_phrases = ["suicide", "killing myself", "end it all", "don't want to live", "he hit me", "she hit me", "afraid for my life", "kill", "die", "divorce", "legal proceedings", "domestic violence"]
    medium_risk_phrases = ["self-harm", "cutting", "can't take it anymore", "scared of him", "scared of her"]

    for phrase in high_risk_phrases:
        if re.search(rf"\b{phrase}\b", text_lower):
            print(f"[GUARDRAIL] Triggered Deterministic High Risk: {phrase}")
            return 2, phrase
    for phrase in medium_risk_phrases:
        if re.search(rf"\b{phrase}\b", text_lower):
            print(f"[GUARDRAIL] Triggered Deterministic Medium Risk: {phrase}")
            return 1, phrase
            
    # --- 2. Semantic Vector Matching (Probabilistic Nuance) ---
    # Catches intents that bypass explicit keywords (e.g., "I don't want to wake up tomorrow")
    if risk_model and anchor_embeddings is not None:
        try:
            user_embedding = risk_model.encode(text, convert_to_tensor=True)
            cosine_scores = util.cos_sim(user_embedding, anchor_embeddings)[0]
            
            max_score = cosine_scores.max().item()
            best_match_idx = cosine_scores.argmax().item()
            
            # Threshold of 0.80 for high semantic similarity
            if max_score > 0.80:
                trigger = HIGH_RISK_ANCHORS[best_match_idx]
                print(f"[GUARDRAIL] Triggered Semantic Match (Score: {max_score:.2f}): {trigger}")
                return 2, f"Semantic Match: {trigger}"
        except Exception as e:
            print(f"[GUARDRAIL ERROR] Semantic matching failed: {e}")

    return 0, None

def generate_response(messages):
    """Generate a response by calling the Groq Cloud API."""
    payload = {
        "model": MODEL_NAME,
        "messages": messages,
        "stream": False 
    }
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(API_URL, json=payload, headers=headers)
        response.raise_for_status() # Raises an error for bad HTTP status codes
        
        data = response.json()
        
        # Groq uses the OpenAI JSON format
        raw_response = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()

        print(f"--- DEBUG: AI CONTENT START ---\n{raw_response}\n--- DEBUG: AI CONTENT END ---")

        # Safety check on the AI's output
        if is_unsafe(raw_response):
            print(f"[SAFETY FILTER] Blocked unsafe AI response.") 
            return (
                "I'm sorry, I cannot provide guidance on this specific situation. "
                "Please reach out to a trusted professional for support."
                f"\n{CRISIS_RESOURCES}"
            )
        
        # # DeepSeek often outputs its "thinking" process inside <think></think> tags.
        # # This regex removes the thinking tags so the user only sees the final advice.

        clean_response = raw_response
        
        # Step 1: The easiest and most reliable method (split by the closing tag)
        # This guarantees we only take whatever comes AFTER the thinking is done.
        if "</think>" in clean_response:
            clean_response = clean_response.split("</think>")[-1]
            
        # Step 2: Fallback regex to catch weird casing (e.g., <Think>) 
        # or cases where the model forgot to close the tag (goes to the end of the string).
        clean_response = re.sub(r'<think>.*?(?:</think>|$)', '', clean_response, flags=re.DOTALL | re.IGNORECASE)

        # Remove first 2 consecutive newlines
        # clean_response = re.sub(r'\n{1,}', '', clean_response, count=1)
        
        return clean_response

    except requests.exceptions.RequestException as e:
        error_details = ""
        if hasattr(e, 'response') and e.response is not None:
            error_details = f" | Details: {e.response.text}"
        print(f"[API ERROR] Failed to connect to Groq: {e}{error_details}")
        return "I'm having trouble connecting to my thought process right now. Please try again in a moment."

def generate_counseling_response(user_input: str, retrieved_context: str = "", history: list = None) -> str:
    if history is None:
        history = []

    system_msg = f"""You are an empathetic, professional marriage counselor AI. 
You use Maslow's Hierarchy of Needs to diagnose and advise on relationship issues.

Use ONLY the following retrieved context to form your advice. 
Retrieved Context:
{retrieved_context}

Instructions:
1. Speak directly to the user in the first-person (using "I", "you", "your", and "we"). Match the exact pronouns the user uses (e.g., husband/wife).
2. Translate the Retrieved Context into a conversational, empathetic dialogue. Do NOT give the user a clinical checklist or tell them what "Action 1" is.
3. Provide gentle, empathetic, actionable advice based strictly on the concepts provided in the context.
4. Provide examples or metaphors to make your advice more relatable.
5. Do NOT make up any information that is not in the retrieved context. If the context does not contain relevant information, respond with message that encourages the user to share more details about their situation.
"""

    messages = [
        {"role": "system", "content": system_msg}
    ]

    # Append past conversation history
    for msg in history:
        role = "user" if msg.get("sender") == "user" else "assistant"
        content = msg.get("text", "")
        # Apply Zero-Trust PII Anonymization to user history
        if role == "user":
            content = anonymize_pii(content)
        messages.append({"role": role, "content": content})

    # Apply Zero-Trust PII Anonymization to current input
    messages.append({"role": "user", "content": anonymize_pii(user_input)})

    # print(f"\n--- DEBUG: OUTGOING MESSAGES PAYLOAD ---\n{messages}\n----------------------------------------\n")
    
    # Call your actual DeepSeek/ECS API here using full_prompt
    return generate_response(messages)

def generate_casual_response(user_msg, history: list = None):
    """
    Builds a lightweight prompt for small talk and uses the base generator.
    """
    if history is None:
        history = []

    casual_prompt = """You are a warm, empathetic AI marriage counselor.
Introduce yourself as a warm, empathetic AI marriage counselor.
Ask the user to describe their marriage situation and how you can support them today.
Do NOT give clinical advice."""

    messages = [
        {"role": "system", "content": casual_prompt}
    ]

    # Append past conversation history
    for msg in history:
        role = "user" if msg.get("sender") == "user" else "assistant"
        content = msg.get("text", "")
        # Apply Zero-Trust PII Anonymization to user history
        if role == "user":
            content = anonymize_pii(content)
        messages.append({"role": role, "content": content})

    # Apply Zero-Trust PII Anonymization to current input
    messages.append({"role": "user", "content": anonymize_pii(user_msg)})

    # Reuse your existing server connection function!
    return generate_response(messages)