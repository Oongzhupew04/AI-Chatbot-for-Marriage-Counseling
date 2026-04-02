from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
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
        email = request.form.get('email')
        password = request.form.get('password')
        try:
            conn = db.get_connection()
            cursor = conn.cursor()

            query = "SELECT password, role FROM users WHERE email = ?"
            cursor.execute(query, (email,))
            
            # Fetch the first matching row (since emails should be unique)
            user_record = cursor.fetchone()
            cursor.close()

            # 3. Check if the user exists in the database
            if user_record:
                db_password = user_record[0]
                db_role = user_record[1]

                # 4. Check if the typed password matches the database password
                if check_password_hash(db_password, password):

                    session['show_checkin'] = True
                    
                    # 5. Route the user based on their role
                    if db_role == 'admin':
                        return redirect(url_for('admin'))
                    else:
                        return redirect(url_for('home'))
            else:
                flash("Invalid email address or password.", "error")

        except Exception as e:
            print(f"Database Login Error: {e}")
            flash("An error occurred connecting to the server.", "error")
            return render_template('auth/login.html')

    # If it's a GET request (just visiting the page), show the form
    return render_template('auth/login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        # Get the input from the registration form
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')

        try:
            conn = db.get_connection()
            cursor = conn.cursor()

            # 2. Check if the email is already registered
            check_query = "SELECT id FROM users WHERE email = ?"
            cursor.execute(check_query, (email,))
            existing_user = cursor.fetchone()

            if existing_user:
                flash("Email is already registered. Please log in instead.", "error")
                cursor.close()
                return redirect(url_for('login'))

            # 3. Hash the password! 
            hashed_pw = generate_password_hash(password)

            # 4. Insert the new user into the openGauss database
            # We set the default role to 'user'
            insert_query = "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)"
            cursor.execute(insert_query, (username, email, hashed_pw, 'user'))
            
            # 5. COMMIT to save the changes to the hard drive!
            conn.commit()
            cursor.close()

            flash("Registration successful! You can now log in.", "success")
            return redirect(url_for('login'))

        except Exception as e:
            print(f"Database Registration Error: {e}")
            flash("An error occurred connecting to the server.", "error")
            return render_template('auth/register.html')

    # If it's a GET request (just visiting the page), show the form
    return render_template('auth/register.html')

@app.route('/home')
def home():

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