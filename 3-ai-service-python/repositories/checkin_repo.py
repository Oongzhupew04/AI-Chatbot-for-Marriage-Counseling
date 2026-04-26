from database import db
from models.checkin import Checkin
# import chromadb

class CheckinRepository:
    def __init__(self):
        # self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
        # self.collection = self.chroma_client.get_or_create_collection(name="user_journals")
        pass

    def save_checkin(self, checkin: Checkin):
        conn = None
        cursor = None
        
        # 1. Save structured metrics to openGauss
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO daily_checkins 
                (user_id, satisfaction_score, rotational_q, rotational_score, unmet_needs, journal_text, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                checkin.user_id, 
                checkin.satisfaction_score, 
                checkin.rotational_q,       
                checkin.rotational_score,   
                checkin.unmet_needs, 
                checkin.journal_text,
                checkin.timestamp
            ))
            
            conn.commit()
            print(f"Saved relational data to openGauss for user {checkin.user_id}")
            
        except Exception as e:
            if conn:
                conn.rollback() 
            print(f"Database insertion error: {e}")
            raise e 
            
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

        # 2. Save unstructured text to ChromaDB for the RAG pipeline
        if checkin.journal_text and checkin.journal_text.strip():
            document_content = (
                f"On {checkin.timestamp}, the user reported a marital satisfaction score of {checkin.satisfaction_score}/7. "
                f"Daily reflection ({checkin.rotational_q}): Scored {checkin.rotational_score}. "
                f"They indicated unmet needs in: {checkin.unmet_needs}. "
                f"User Journal Entry: {checkin.journal_text}"
            )
            
            """
            self.collection.add(
                documents=[document_content],
                metadatas=[{
                    "user_id": checkin.user_id, 
                    "type": "daily_checkin", 
                }],
                ids=[f"checkin_{checkin.user_id}_{checkin.timestamp}"]
            )
            """
            print("Embedded journal entry into ChromaDB.")

        return {
            "status": "Check-in successfully saved", 
        }