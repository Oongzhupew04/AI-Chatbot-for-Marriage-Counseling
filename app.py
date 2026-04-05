from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from services.auth_service import AuthService
from dotenv import load_dotenv
from deepseek_ai_cloud import analyze_risk, detect_intent, generate_response, CRISIS_RESOURCES
from services.chat_service import ChatService
from repositories.chat_repo import ChatRepository


app = Flask(__name__)
app.secret_key = "secret_sage_key" # Required for session management
auth_service = AuthService()
chat_service = ChatService()
chat_repo = ChatRepository()


load_dotenv()

# --- CONTROLLER ROUTES ---

@app.route('/')
def index():
    # Redirect root URL to login page
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user, error = auth_service.login(email, password)
        
        if error:
            flash(error, "error")
            return render_template('auth/login.html')
        
        session['user_id'] = user.id
        session['show_checkin'] = True
        if user.role == 'admin':
            return redirect(url_for('admin'))
        else:
            return redirect(url_for('home'))
    
    return render_template('auth/login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        success, message = auth_service.register(username, email, password)
        
        if success:
            flash(message, "success")
            return redirect(url_for('login'))
        else:
            flash(message, "error")
            return render_template('auth/register.html')
    
    return render_template('auth/register.html')

@app.route('/home')
def home():
    user_id = session.get('user_id')
    if not user_id:
        return redirect(url_for('login'))
        
    # 2. THE FIX: Generate a brand new chat session EVERY time this page loads
    new_chat = chat_repo.create_chat(user_id)
    
    if new_chat:
        # Overwrite the old chat_id in the cookie with the brand new one
        session['chat_id'] = new_chat.id

    show_modal = session.pop('show_checkin', False)

    return render_template('dashboard/home.html', show_modal=show_modal)

@app.route('/analysis')
def analysis():
    return render_template('dashboard/analysis.html')

@app.route('/admin_home')
def admin():
    return render_template('admin/home.html')

# --- POP-UP ROUTES ---
# In a full app, these might be modals, but for now, we link them as pages
# @app.route('/checkin')
# def checkin():
#     return render_template('dashboard/modals/checkin.html')

@app.route('/feedback')
def feedback():
    return render_template('dashboard/modals/feedback.html')

@app.route('/new_chat', methods=['POST'])
def new_chat():
    """Start a fresh chat session."""
    session.pop('chat_id', None)  # Clear the old chat_id
    return jsonify({"status": "success", "message": "Starting new chat..."})

@app.route('/get_response', methods=['POST'])
def get_response():
    user_id = session.get('user_id')  # Set at login
    chat_id = chat_service.get_or_create_chat(user_id, session.get('chat_id', None))
    session['chat_id'] = chat_id

    # Keep the original casing for the LLM prompt.
    user_input = request.json.get('message', '').strip()
    
    # 1. Check for "end session" keyword (Frontend action)
    if "end session" in user_input.lower():
        return jsonify({
            "response": "Are you sure you want to end this session?",
            "action": "confirm_end" 
        })
    
    # 2. Risk detection (Highest Priority)
    risk_level = analyze_risk(user_input)
    if risk_level >= 1:
        urgency = "high" if risk_level == 2 else "moderate"
        bot_reply = f"I am hearing that you are in a very distressing and potentially unsafe situation. {CRISIS_RESOURCES}"
        if urgency == "high":
            bot_reply += "\n*Please* reach out to someone for physical support right now."
        
        # Log to your database and return the crisis response
        chat_service.log_message(chat_id, user_input, "[CRISIS INTERVENTION TRIGGERED]", risk_level)
        return jsonify({"response": bot_reply, "action": "none"})

    # 3. Intent/mood detection (Hardcoded rules for common issues)
    intent_response = detect_intent(user_input)
    if intent_response:
        chat_service.log_message(chat_id, user_input, intent_response, risk_level)
        return jsonify({"response": intent_response, "action": "none"})

    # 4. Default LLM response (Sending to Huawei ECS)
    system_msg = (
        "You are a professional, empathetic, and neutral marriage counselor. "
        "Provide constructive advice, validate feelings, and encourage healthy communication between partners. "
        "Do not take sides. Keep your responses concise and conversational.\n\n"
    )
    full_prompt = f"{system_msg}User: {user_input}\nCounselor:"
    
    # Call your ECS server
    ai_response = generate_response(full_prompt)
    
    # Log the successful AI response
    chat_service.log_message(chat_id, user_input, ai_response, risk_level)

    # Return the AI response to the frontend
    return jsonify({
        "response": ai_response, 
        "action": "none"
    })

if __name__ == '__main__':
    app.run(debug=True)