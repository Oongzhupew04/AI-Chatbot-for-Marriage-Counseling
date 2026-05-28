import requests
import re

# --- CONFIGURATION ---
# The IP and Port of your Huawei Cloud ECS running Ollama
OLLAMA_API_URL = "http://127.0.0.1:11434/api/chat"
MODEL_NAME = "deepseek-r1:1.5b"

# --- CONSTANTS ---
CRISIS_RESOURCES = (
    "\nIf you or your partner are in immediate danger, or experiencing a crisis, "
    "please contact local emergency services or the National Domestic Violence Hotline."
)

# Marriage Counseling Specific Keywords
KEYWORD_RESPONSES = {
    "divorce": "Mentioning divorce means you are carrying a heavy burden right now. Let's take a breath. What led to this feeling today?",
    "affair": "Dealing with infidelity is incredibly painful and complex. It's important to process these emotions safely. How are you holding up?",
    "cheating": "Trust is the foundation of a relationship, and feeling it has been broken is devastating. Would you like to talk about what happened?",
    "finances": "Money is one of the most common stressors in a marriage. Maybe we can explore how you both communicate about financial goals.",
    "abuse": "Your safety is the absolute highest priority. No one deserves to feel unsafe in their relationship. " + CRISIS_RESOURCES,
}

# Unsafe keywords (Self-harm and severe escalation)
UNSAFE_PATTERNS = [
    r"\bcut\b.*\byourself\b", r"\bself[\s-]?harm\b", r"\bkill\b.*\byourself\b", r"\bdie\b", r"\bsuicide\b",
    r"\boverdose\b", r"\bhang\b.*\byourself\b", r"\bend\b.*\blife\b",
    r"\bharm\b.*\byourself\b", r"\bpunish\b.*\byourself\b", r"\bhit\b.*\bme\b", r"\bbeat\b.*\bme\b"
]

def is_unsafe(text):
    """Check if text contains unsafe content."""
    text_lower = text.lower()
    return any(re.search(pattern, text_lower) for pattern in UNSAFE_PATTERNS)

def detect_intent(text):
    """Detect user intent/keywords and suggest tailored responses."""
    text_lower = text.lower()
    for keyword, response in KEYWORD_RESPONSES.items():
        if keyword in text_lower:
            return response
    return None

def is_casual_chat(user_msg):
    msg_lower = user_msg.lower().strip()
    
    # Common conversational starters/enders
    casual_phrases = [
        "hi", "hello", "hey", "how are you", "good morning", 
        "good afternoon", "good evening", "thanks", "thank you", 
        "who are you", "bye", "goodbye", "see you"
    ]
    
    if msg_lower in casual_phrases:
        return True
        
    # If it's a very short message containing a casual word, it's likely casual
    words = msg_lower.split()
    if len(words) <= 5 and any(phrase in msg_lower for phrase in casual_phrases):
        return True
        
    return False

def analyze_risk(text):
    """Assess risk level (0-2) based on keywords and intensity. Returns (risk_level, trigger_keyword)."""
    high_risk_phrases = ["suicide", "killing myself", "end it all", "don't want to live", "he hit me", "she hit me", "afraid for my life", "kill", "die"]
    medium_risk_phrases = ["self-harm", "cutting", "can't take it anymore", "scared of him", "scared of her"]

    for phrase in high_risk_phrases:
        if re.search(rf"\b{phrase}\b", text.lower()):
            return 2, phrase
    for phrase in medium_risk_phrases:
        if re.search(rf"\b{phrase}\b", text.lower()):
            return 1, phrase
    return 0, None

def generate_response(messages):
    """Generate a response by calling the DeepSeek model on the ECS instance."""
    payload = {
        "model": MODEL_NAME,
        "messages": messages,
        "stream": False 
    }
    
    try:
        response = requests.post(OLLAMA_API_URL, json=payload)
        response.raise_for_status() # Raises an error for bad HTTP status codes
        
        data = response.json()
        raw_response = data.get("message", {}).get("content", "").strip()

        print(f"--- DEBUG: RAW RESPONSE START ---\n{raw_response}\n--- DEBUG: RAW RESPONSE END ---")

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
        print(f"[API ERROR] Failed to connect to DeepSeek: {e}")
        return "I'm having trouble connecting to my thought process right now. Please try again in a moment."

def generate_counseling_response(user_input: str, retrieved_context: str = "") -> str:
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
        {"role": "system", "content": system_msg},
        {"role": "user", "content": user_input}
    ]

    # print(f"\n--- DEBUG: OUTGOING MESSAGES PAYLOAD ---\n{messages}\n----------------------------------------\n")
    
    # Call your actual DeepSeek/ECS API here using full_prompt
    return generate_response(messages)

def generate_casual_response(user_msg):
    """
    Builds a lightweight prompt for small talk and uses the base generator.
    """
    casual_prompt = """You are a warm, empathetic AI marriage counselor.
Introduce yourself as a warm, empathetic AI marriage counselor.
Ask the user to describe their marriage situation and how you can support them today.
Do NOT give clinical advice."""

    messages = [
        {"role": "system", "content": casual_prompt},
        {"role": "user", "content": user_msg}
    ]

    # Reuse your existing server connection function!
    return generate_response(messages)