# Simple representation of the data logic
class User:
    def __init__(self, username, email, password):
        self.username = username
        self.email = email
        self.password = password

    def check_password(self, input_password):
        return self.password == input_password

# Example of a Session Model
class SessionData:
    def __init__(self, date, score, topics):
        self.date = date
        self.score = score
        self.topics = topics