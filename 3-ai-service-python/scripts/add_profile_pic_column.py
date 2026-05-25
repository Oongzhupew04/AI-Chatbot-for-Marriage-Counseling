import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import db

def main():
    print("Adding profile_pic column to users table...")
    try:
        cursor = db.get_connection().cursor()
        cursor.execute("ALTER TABLE users ADD COLUMN profile_pic TEXT;")
        db.get_connection().commit()
        cursor.close()
        print("Successfully added profile_pic column!")
    except Exception as e:
        print(f"Error (column might already exist): {e}")

if __name__ == "__main__":
    main()
