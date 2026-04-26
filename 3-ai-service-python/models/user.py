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
        # **kwargs catches q10 to q19, and the calculated scale_1_score
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
        
        # Dynamically attach Scale 1 variables (q10-q19) and calculated scale_1_score
        for key, value in kwargs.items():
            setattr(self, key, value)