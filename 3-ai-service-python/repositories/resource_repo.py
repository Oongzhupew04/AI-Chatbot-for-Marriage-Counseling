from database import db
from models.resource import Resource

class ResourceRepository:
    def get_all_resources(self):
        connection = None
        cursor = None
        resources = []
        try:
            connection = db.get_connection()
            cursor = connection.cursor()
            cursor.execute("SELECT id, title, description, type, url, icon FROM resources ORDER BY id ASC")
            rows = cursor.fetchall()
            
            for row in rows:
                resources.append(Resource(
                    id=row[0],
                    title=row[1],
                    description=row[2],
                    type=row[3],
                    url=row[4],
                    icon=row[5]
                ))
            return resources
        except Exception as e:
            print(f"Error fetching resources: {e}")
            return []
        finally:
            if cursor:
                cursor.close()
