# models/user.py
class User:
    def __init__(
        self, 
        id, 
        username, 
        email, 
        password_hash, 
        role, 
        # Demographics default to None for flexible loading
        sex=None, 
        age=None, 
        years_married=None, 
        children_count=None, 
        children_raised=None, 
        education=None, 
        material_situation=None, 
        religious_affiliation=None, 
        religiousness=None,
        profile_pic=None,
        dark_mode_enabled=False,
        push_notifications_enabled=False,
        # **kwargs catches q13, q17, q19, q20, and the calculated marital_risk_percentage
        **kwargs
    ):
        # Core Auth
        self.id = id
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.role = role
        
        # Demographics
        self.sex = sex
        self.age = age
        self.years_married = years_married
        self.children_count = children_count
        self.children_raised = children_raised
        self.education = education
        self.material_situation = material_situation
        self.religious_affiliation = religious_affiliation
        self.religiousness = religiousness
        self.profile_pic = profile_pic
        
        # Preferences
        self.dark_mode_enabled = dark_mode_enabled
        self.push_notifications_enabled = push_notifications_enabled
        
        # Dynamically attach Scale 1 variables (q13, q17, q19, q20) and calculated marital_risk_percentage
        for key, value in kwargs.items():
            setattr(self, key, value)