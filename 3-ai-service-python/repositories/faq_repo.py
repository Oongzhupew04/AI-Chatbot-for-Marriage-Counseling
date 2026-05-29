from database import db
from models.faq import Faq

class FaqRepository:
    def get_all_faqs(self):
        connection = None
        cursor = None
        faqs = []
        try:
            connection = db.get_connection()
            cursor = connection.cursor()
            cursor.execute("SELECT id, question, answer FROM faq ORDER BY id ASC")
            rows = cursor.fetchall()
            
            for row in rows:
                faqs.append(Faq(
                    id=row[0],
                    question=row[1],
                    answer=row[2]
                ))
            return faqs
        except Exception as e:
            print(f"Error fetching FAQs: {e}")
            return []
        finally:
            if cursor:
                cursor.close()

    def add_faq(self, question: str, answer: str):
        connection = None
        cursor = None
        try:
            connection = db.get_connection()
            cursor = connection.cursor()
            cursor.execute("INSERT INTO faq (question, answer) VALUES (?, ?)", (question, answer))
            connection.commit()
            return True, "FAQ uploaded successfully"
        except Exception as e:
            print(f"Error adding FAQ: {e}")
            if connection:
                connection.rollback()
            return False, "Failed to add FAQ to database"
        finally:
            if cursor:
                cursor.close()
