from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from database import db
import os
import threading
import jaydebeapi
from dotenv import load_dotenv

app = Flask(__name__)
app.secret_key = "secret_sage_key" # Required for session management

load_dotenv()

class DatabaseSingleton:
    _instance = None
    _lock = threading.Lock()
    _connection = None

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(DatabaseSingleton, cls).__new__(cls)
                    cls._instance._initialize_connection()
        return cls._instance

    def _initialize_connection(self):
        """This runs ONLY ONCE when the first instance is created."""
        print("=> Starting JVM and opening openGauss connection (This should only print ONCE)...")
        
        jar_path = os.getenv("DB_JAR_PATH")
        driver_class = "org.opengauss.Driver"
        
        host = os.getenv("DB_HOST")
        port = os.getenv("DB_PORT")
        db_name = os.getenv("DB_NAME")
        url = f"jdbc:opengauss://{host}:{port}/{db_name}"
        
        username = os.getenv("DB_USER")
        password = os.getenv("DB_PASSWORD")

        try:
            self._connection = jaydebeapi.connect(
                jclassname=driver_class,
                url=url,
                driver_args=[username, password],
                jars=jar_path
            )
        except Exception as e:
            print(f"CRITICAL: Failed to connect to database. Error: {e}")
            raise e

    def get_connection(self):
        """Returns the active database connection."""
        return self._connection

db = DatabaseSingleton()

# --- CONTROLLER ROUTES ---

@app.route('/')
def index():
    # Redirect root URL to login page
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Get the email and password from the form
        email = request.form.get('email')
        password = request.form.get('password')

        # --- HARDCODED LOGIN LOGIC ---
        # List of allowed emails
        allowed_users = ["vincentoong12345@gmail.com", "admin@gmail.com"]

        if email in allowed_users:
            # If email is admin, go to admin page
            if email == "admin@gmail.com":
                return redirect(url_for('admin'))
            
            # If regular user, go to home page
            return redirect(url_for('checkin'))
        else:
            # If email is NOT allowed, show error and stay on login page
            flash("Invalid email address. Access denied.", "error")
            return render_template('auth/login.html')

    return render_template('auth/login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        # Here you would call a Model to save the new user
        return redirect(url_for('login'))
    return render_template('auth/register.html')

@app.route('/home')
def home():
    return render_template('dashboard/home.html')

@app.route('/analysis')
def analysis():
    return render_template('dashboard/analysis.html')

@app.route('/admin_home')
def admin():
    return render_template('admin/home.html')

# --- POP-UP ROUTES ---
# In a full app, these might be modals, but for now, we link them as pages
@app.route('/checkin')
def checkin():
    return render_template('dashboard/modals/checkin.html')

@app.route('/feedback')
def feedback():
    return render_template('dashboard/modals/feedback.html')

@app.route('/get_response', methods=['POST'])
def get_response():
    user_input = request.json.get('message', '').lower()
    
    # 1. Check for "end session" keyword
    if "end session" in user_input:
        return jsonify({
            "response": "Are you sure you want to end this session?",
            "action": "confirm_end" # <--- Signal to frontend to show buttons
        })
    
    # 2. Default Hardcoded Response
    return jsonify({
        "response": "Hello Vincent, how can I help you?", 
        "action": "none"
    })

if __name__ == '__main__':
    app.run(debug=True)