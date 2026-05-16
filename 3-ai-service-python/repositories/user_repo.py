# repositories/user_repo.py
from database import db
from models.user import User

class UserRepository:
    def get_by_email(self, email):
        cursor = db.get_connection().cursor()
        cursor.execute("SELECT id, username, email, password, role FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        cursor.close()
        if row:
            return User(row[0], row[1], row[2], row[3], row[4])
        return None

    def create(self, username, email, password_hash, demographics, scale_1, marital_risk_percentage):
        cursor = db.get_connection().cursor()
        
        query = """
            INSERT INTO users (
                username, email, password, role,
                sex, age, years_married, children_count, children_raised,
                education, material_situation, religious_affiliation, religiousness,
                q13, q17, q19, q20, marital_risk_percentage
            ) VALUES (
                ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?, ?
            )
        """
        
        values = (
            username, email, password_hash, 'user',
            # Demographics
            demographics.get('sex'), demographics.get('age'), demographics.get('years_married'),
            demographics.get('children_count'), demographics.get('children_raised'), 
            demographics.get('education'), demographics.get('material_situation'), 
            demographics.get('religious_affiliation'), demographics.get('religiousness'),
            # Scale 1 Text Values
            scale_1.get('q13'), scale_1.get('q17'), scale_1.get('q19'), scale_1.get('q20'),
            # Calculated Final Score
            marital_risk_percentage
        )
        
        cursor.execute(query, values)
        db.get_connection().commit()
        cursor.close()

    def get_by_id(self, user_id):
        cursor = db.get_connection().cursor()
        
        # Explicitly listing columns ensures row[0], row[1], etc., are always exactly what we expect
        query = """
            SELECT 
                id, username, email, password, role,
                sex, age, years_married, children_count, children_raised,
                education, material_situation, religious_affiliation, religiousness,
                q13, q17, q19, q20, marital_risk_percentage
            FROM users 
            WHERE id = ?
        """
        
        cursor.execute(query, (user_id,))
        row = cursor.fetchone()
        cursor.close()
        
        if row:
            # Map the tuple back into the User model using explicit keyword arguments
            return User(
                id=row[0],
                username=row[1],
                email=row[2],
                password_hash=row[3],
                role=row[4],
                # Demographics
                sex=row[5],
                age=row[6],
                years_married=row[7],
                children_count=row[8],
                children_raised=row[9],
                education=row[10],
                material_situation=row[11],
                religious_affiliation=row[12],
                religiousness=row[13],
                # Scale 1 Text Values & Score (These will be caught by **kwargs in the User model)
                q13=row[14], 
                q17=row[15], 
                q19=row[16], 
                q20=row[17],
                marital_risk_percentage=row[18]
            )
            
        return None