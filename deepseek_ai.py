from llama_cpp import Llama
import re
import os
from database import db

script_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(script_dir, "DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf")

# Initialize the model
llm = Llama(
    model_path=model_path,
    n_ctx=512,
    n_threads=4,
    n_batch=128,
    f16_kv=True
)

# Crisis resources (global constant)
CRISIS_RESOURCES = (
    "\nIf you're in crisis, contact the National Suicide Prevention Lifeline at "
    "1-800-273-TALK (8255) or a trusted professional immediately."
)

# Mood/Intent Keywords (expand as needed)
KEYWORD_RESPONSES = {
    "depression": "It sounds like you're feeling really low. Would you like to share more about what's weighing on you?",
    "anxiety": "Anxiety can feel overwhelming. Let’s explore what might help you feel grounded.",
    "lonely": "Loneliness is tough. Have you considered reaching out to a friend or support group?",
    "stress": "Stress can pile up. Maybe we can break down what’s bothering you into smaller parts.",
}

# Unsafe keywords (adapt as needed)
UNSAFE_PATTERNS = [
    r"\bcut\b.*\byourself\b", r"\bself[\s-]?harm\b", r"\bkill\b.*\byourself\b",
    r"\boverdose\b", r"\bhang\b.*\byourself\b", r"\bend\b.*\blife\b",
    r"\bharm\b.*\byourself\b", r"\bpunish\b.*\byourself\b"
]

def log_to_db(user_msg, bot_msg, risk_lvl):
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        query = "INSERT INTO chat_logs (user_message, bot_response, risk_level) VALUES (?, ?, ?)"
        cursor.execute(query, (user_msg, bot_msg, risk_lvl))
        # Note: JayDeBeApi/JDBC connection usually needs a commit if not in auto-commit mode
        conn.commit() 
        cursor.close()
    except Exception as e:
        print(f"Database Log Error: {e}")

def is_unsafe(text):
    """Check if text contains unsafe content (bot or user)."""
    text_lower = text.lower()
    return any(re.search(pattern, text_lower) for pattern in UNSAFE_PATTERNS)

def detect_intent(text):
    """Detect user intent/keywords and suggest tailored responses."""
    text_lower = text.lower()
    for keyword, response in KEYWORD_RESPONSES.items():
        if keyword in text_lower:
            return response
    return None

def analyze_risk(text):
    """Assess risk level (0-2) based on keywords and intensity."""
    high_risk_phrases = ["suicide", "kill myself", "end it all", "don't want to live"]
    medium_risk_phrases = ["self-harm", "cutting", "can't take it anymore"]

    if any(re.search(rf"\b{phrase}\b", text.lower()) for phrase in high_risk_phrases):
        return 2  # High risk
    elif any(re.search(rf"\b{phrase}\b", text.lower()) for phrase in medium_risk_phrases):
        return 1  # Medium risk
    return 0  # Low risk

def generate_response(prompt):
    """Generate a response using the LLM."""
    output = llm(
        prompt,
        max_tokens=256,
        temperature=0.7,
        stop=["###"],
    )
    raw_response = output["choices"][0]["text"].split("###")[0].strip()

    # Safety check
    if is_unsafe(raw_response):
        print(f"[SAFETY FILTER] Blocked unsafe response: {raw_response[:100]}...")  # Log
        return (
            "I'm sorry, I can't provide guidance on this. "
            "Please reach out to a trusted professional for support."
            f"\n{CRISIS_RESOURCES}"
        )
    return raw_response


def main():
    system_msg = (
        "### System: You are a mental health assistant. Respond with empathy and validation. "
        "Ask open-ended questions. Never give medical advice.\n"
    )
    print("\nMental Health Support Bot (Type 'exit' to quit)")
    print("---------------------------------------------")

    while True:
        user_msg = input("\nYou: ").strip()

        if user_msg.lower() == "exit":
            print("Bot: Thank you for talking with me. Remember, you matter. ❤️")
            break

        # Risk detection (priority)
        risk_level = analyze_risk(user_msg)
        if risk_level >= 1:
            urgency = "high" if risk_level == 2 else "moderate"
            print(f"\nBot: I hear how much pain you're in. You're not alone. {CRISIS_RESOURCES}")
            if urgency == "high":
                print("\n*Please* reach out to someone right now.")
            continue

        # Intent/mood detection
        intent_response = detect_intent(user_msg)
        if intent_response:
            print(f"Bot: {intent_response}")
            continue

        # Default LLM response
        prompt = f"{system_msg}### User: {user_msg}\n### Assistant:"
        response = generate_response(prompt)
        print(f"Bot: {response}")

        log_to_db(user_msg, response, risk_level)

if __name__ == "__main__":
    main()