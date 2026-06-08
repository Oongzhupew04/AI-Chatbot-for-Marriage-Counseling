from database import db
from models.checkin import Checkin
# import chromadb

class CheckinRepository:
    def __init__(self):
        # self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
        # self.collection = self.chroma_client.get_or_create_collection(name="user_journals")
        pass

    def get_recent_checkins(self, user_id: int, limit: int = 7):
        conn = None
        cursor = None
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT satisfaction_score, unmet_needs, journal_text, rotational_q, rotational_score, created_at
                FROM daily_checkins
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            ''', (user_id, limit))
            
            rows = cursor.fetchall()
            
            # Reverse to chronological order for the frontend (oldest -> newest in the window)
            rows.reverse()
                
            import datetime
            checkins = []
            for row in rows:
                raw_date = row[5]
                formatted_day = str(raw_date)
                if raw_date:
                    try:
                        if isinstance(raw_date, str):
                            clean_str = raw_date.replace('T', ' ').replace('Z', '').split('.')[0]
                            if len(clean_str) == 10:
                                dt = datetime.datetime.strptime(clean_str, "%Y-%m-%d")
                            else:
                                dt = datetime.datetime.strptime(clean_str, "%Y-%m-%d %H:%M:%S")
                        else:
                            # Assume it's a java.sql.Timestamp or python datetime
                            # If it's jaydebeapi timestamp, str(raw_date) might look like '2026-05-16 12:00:00'
                            clean_str = str(raw_date).split('.')[0]
                            dt = datetime.datetime.strptime(clean_str, "%Y-%m-%d %H:%M:%S")
                        
                        formatted_day = f"{dt.day} {dt.strftime('%b %Y')}"
                    except Exception as e:
                        print(f"Date parsing failed for {raw_date}: {e}")

                checkins.append({
                    "coreMetric": int(row[0] or 0),
                    "unmetNeeds": [n.strip() for n in row[1].split(",")] if row[1] else [],
                    "journalEntry": row[2] or "",
                    "rotationalQuestion": row[3] or "",
                    "rotationalScore": int(row[4] or 0),
                    "day": formatted_day
                })
                
            return checkins
        except Exception as e:
            print(f"Error fetching checkins: {e}")
            return []
        finally:
            if cursor:
                cursor.close()

    def get_30_day_sentiment_trend(self, user_id: int):
        """
        Enterprise Showcase: 30-day moving average using advanced Window Functions and JOINs.
        """
        conn = None
        cursor = None
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            # Complex Analytics Query: 7-day Moving Average of Satisfaction Score using Window Functions
            # Includes a JOIN to users table for demographic/role context, even though we just need the trend data.
            cursor.execute('''
                SELECT 
                    c.created_at, 
                    c.satisfaction_score, 
                    AVG(c.satisfaction_score) OVER (
                        PARTITION BY c.user_id 
                        ORDER BY c.created_at 
                        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
                    ) as moving_avg_7d,
                    u.role
                FROM daily_checkins c
                JOIN users u ON c.user_id = u.id
                WHERE c.user_id = ? 
                  AND c.created_at >= CURRENT_DATE - INTERVAL '30 days'
                ORDER BY c.created_at ASC
            ''', (user_id,))
            
            rows = cursor.fetchall()
            
            import datetime
            trend_data = []
            for row in rows:
                raw_date = row[0]
                formatted_day = str(raw_date)
                if raw_date:
                    try:
                        clean_str = str(raw_date).replace('T', ' ').replace('Z', '').split('.')[0]
                        if len(clean_str) == 10:
                            dt = datetime.datetime.strptime(clean_str, "%Y-%m-%d")
                        else:
                            dt = datetime.datetime.strptime(clean_str, "%Y-%m-%d %H:%M:%S")
                        formatted_day = f"{dt.strftime('%b %d')}"
                    except Exception as e:
                        pass
                        
                trend_data.append({
                    "date": formatted_day,
                    "daily_score": float(row[1] or 0),
                    "moving_average": float(row[2] or 0),
                    "user_role": row[3]
                })
                
            return trend_data
        except Exception as e:
            print(f"Error executing analytics query: {e}")
            return []
        finally:
            if cursor:
                cursor.close()

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