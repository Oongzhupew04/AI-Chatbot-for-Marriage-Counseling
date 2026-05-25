import sys
import os

# Add the parent directory to the python path so we can import database
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import db

def seed_faq_table():
    connection = None
    cursor = None
    try:
        connection = db.get_connection()
        cursor = connection.cursor()

        # 1. Create the table
        create_table_query = """
        CREATE TABLE IF NOT EXISTS faq (
            id SERIAL PRIMARY KEY,
            question TEXT NOT NULL,
            answer TEXT NOT NULL
        )
        """
        cursor.execute(create_table_query)
        print("Table 'faq' ensured.")

        # 2. Check if it's empty
        cursor.execute("SELECT COUNT(*) FROM faq")
        count = cursor.fetchone()[0]

        if count == 0:
            print("Table 'faq' is empty. Inserting default FAQs...")
            faqs = [
                ("How do I start a new session?", "You can start a new session by navigating to the Home page and typing in the chat box at the bottom. The AI will automatically begin responding."),
                ("Is my data private?", "Yes. All your conversations and check-in data are securely stored and strictly private. We do not share your information with any third parties."),
                ("How is my relationship risk calculated?", "Our AI model analyzes your daily check-ins, the severity of unmet needs based on Maslow's hierarchy, and long-term behavioral trends to provide a reliable risk baseline."),
                ("Can I export my chat history?", "Yes. You can navigate to Settings > Privacy & Security and click on the 'Export' button to download a copy of your session data.")
            ]

            insert_query = "INSERT INTO faq (question, answer) VALUES (?, ?)"
            for question, answer in faqs:
                cursor.execute(insert_query, (question, answer))
            
            connection.jconn.commit()
            print("Successfully inserted 4 default FAQs.")
        else:
            print(f"Table 'faq' already contains {count} entries. Skipping seeding.")

    except Exception as e:
        print(f"Error seeding FAQ table: {e}")
        if connection:
            connection.jconn.rollback()
    finally:
        if cursor:
            cursor.close()

if __name__ == "__main__":
    seed_faq_table()
