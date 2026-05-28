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
            cursor.execute("SELECT id, title, description, type, url, icon, created_at FROM resources ORDER BY id ASC")
            rows = cursor.fetchall()
            
            for row in rows:
                resources.append(Resource(
                    id=row[0],
                    title=row[1],
                    description=row[2],
                    type=row[3],
                    url=row[4],
                    icon=row[5],
                    created_at=str(row[6]) if row[6] else None
                ))
            return resources
        except Exception as e:
            print(f"Error fetching resources: {e}")
            return []
        finally:
            if cursor:
                cursor.close()

    def add_resource(self, title: str, description: str, type: str, url: str, icon: str):
        connection = None
        cursor = None
        try:
            connection = db.get_connection()
            cursor = connection.cursor()
            
            cursor.execute(
                "INSERT INTO resources (title, description, type, url, icon, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                (title, description, type, url, icon)
            )
            connection.commit()
            
            # Fetch the inserted ID (openGauss doesn't easily return RETURNING id with standard DB-API execute sometimes, but we'll try to just return True on success)
            return True, "Resource added successfully"
        except Exception as e:
            print(f"Error adding resource: {e}")
            if connection:
                connection.rollback()
            return False, str(e)
        finally:
            if cursor:
                cursor.close()

    def delete_resource(self, resource_id: int):
        connection = None
        cursor = None
        try:
            connection = db.get_connection()
            cursor = connection.cursor()
            
            cursor.execute("DELETE FROM resources WHERE id = ?", (resource_id,))
            connection.commit()
            return True, "Resource deleted successfully"
        except Exception as e:
            print(f"Error deleting resource: {e}")
            if connection:
                connection.rollback()
            return False, str(e)
        finally:
            if cursor:
                cursor.close()
