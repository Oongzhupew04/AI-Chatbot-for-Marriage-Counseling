class Resource:
    def __init__(self, id, title, description, type, url, icon, created_at=None):
        self.id = id
        self.title = title
        self.description = description
        self.type = type
        self.url = url
        self.icon = icon
        self.created_at = created_at
