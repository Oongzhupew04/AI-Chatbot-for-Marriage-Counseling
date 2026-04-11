import os
import jaydebeapi
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class DatabaseSingleton:
    _instance = None
    _connection = None

    def __new__(cls):
        # If an instance doesn't exist, create it and connect to the DB
        if cls._instance is None:
            cls._instance = super(DatabaseSingleton, cls).__new__(cls)
            cls._instance._initialize_connection()
        
        # If it does exist, just return the existing instance
        return cls._instance

    def _initialize_connection(self):
        """This runs ONLY ONCE when the first instance is created."""
        print("=> Starting JVM and opening openGauss connection (This should only print ONCE)...")
        
        # 1. Get the filename from .env
        jar_filename = os.getenv("DB_JAR_PATH")
        
        # 2. THE FIX: Convert to an absolute path 
        current_dir = os.path.dirname(os.path.abspath(__file__))
        jar_path = os.path.join(current_dir, jar_filename)
        
        print(f"=> Looking for driver at: {jar_path}")
        
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
            self._connection.jconn.setAutoCommit(False)
            print("=> Auto-commit is OFF. Manual commits are now required.")
        except Exception as e:
            print(f"CRITICAL: Failed to connect to database. Error: {e}")
            raise e

    def get_connection(self):
        """Returns the active database connection."""
        return self._connection

# Create a single, global instance that your app can import
db = DatabaseSingleton()