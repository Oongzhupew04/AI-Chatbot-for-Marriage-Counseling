import sys
import os

# Add the root directory to the python path so we can import 'database'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import db

def seed_resources():
    try:
        connection = db.get_connection()
        cursor = connection.cursor()

        # Create table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS resources (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            type VARCHAR(50) NOT NULL,
            url VARCHAR(255) NOT NULL,
            icon VARCHAR(100)
        );
        """)

        # Clear existing data just in case to avoid duplicates
        cursor.execute("DELETE FROM resources;")

        # Insert some curated resources
        resources = [
            ("The 5 Love Languages", "Understanding the basics of how you and your partner give and receive love to foster a deeper connection.", "article", "https://5lovelanguages.com/", "fas fa-heart"),
            ("Conflict Resolution Worksheet", "A printable PDF worksheet for managing disagreements without escalation and identifying core triggers.", "pdf", "#", "fas fa-file-pdf"),
            ("Effective Communication Guide", "Video guide on active listening, empathy, and avoiding defensive stonewalling during arguments.", "video", "https://www.youtube.com", "fas fa-video"),
            ("Financial Harmony", "Actionable tips on how to merge finances, budget together, and avoid financial infidelity.", "article", "#", "fas fa-coins")
        ]

        cursor.executemany(
            "INSERT INTO resources (title, description, type, url, icon) VALUES (?, ?, ?, ?, ?)", 
            resources
        )
        
        connection.commit()
        print("Resources table created and seeded successfully!")

    except Exception as e:
        print(f"Error seeding resources: {e}")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()

if __name__ == "__main__":
    seed_resources()
