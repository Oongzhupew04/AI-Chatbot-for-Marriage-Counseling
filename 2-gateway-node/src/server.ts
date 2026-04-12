import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import morgan from 'morgan';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
// This points to your Python AI Service (FastAPI/Flask running on port 8000)
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_sage_key_2026';

// Define custom interface for the Request to include user data
interface AuthRequest extends Request {
    user?: any;
}

// --- SECURITY MIDDLEWARE ---
// This replaces Flask's 'session.get("user_id")'
const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: "Access denied. No token provided." });
        return;
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            res.status(403).json({ error: "Invalid or expired token." });
            return;
        }
        req.user = user;
        next();
    });
};

// ==========================================
// --- 1. AUTHENTICATION ROUTES ---
// ==========================================

// Translate: @app.route('/register', methods=['POST'])
app.post('/api/auth/register', async (req: Request, res: Response): Promise<void> => {
    const { username, email, password } = req.body;
    
    try {
        // Forward the registration data to your Python backend to save in openGauss
        const response = await axios.post(`${PYTHON_SERVICE_URL}/internal/register`, {
            username, email, password
        });
        
        res.json(response.data);
    } catch (error: any) {
        console.error("Python DB Error:", error.message);
        // Fallback for testing if Python isn't fully hooked up yet
        res.json({ success: true, message: "Mock Registration Successful (Connect DB Later)" });
    }
});

// Translate: @app.route('/login', methods=['POST'])
app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    
    try {
        // 1. Send the email/password to Python for Database verification
        const pythonResponse = await axios.post(`${PYTHON_SERVICE_URL}/internal/login`, {
            email: email,
            password: password
        });

        // 2. If Python replies with success = true, the password was right!
        if (pythonResponse.data.success) {
            const user = pythonResponse.data.user;

            // Generate the secure JWT token with the REAL database ID and Role
            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role }, 
                JWT_SECRET, 
                { expiresIn: '24h' }
            );
            
            res.json({ role: user.role, token: token, message: "Login successful" });
        }
    } catch (error: any) {
        // 3. Catch errors (Like Wrong Password or Database Offline)
        if (error.response && error.response.status === 401) {
            // Python threw a 401 error (Wrong password)
            res.status(401).json({ error: error.response.data.detail || "Invalid email or password" });
        } else {
            // Python crashed or openGauss is down
            console.error("Database Connection Error:", error.message);
            res.status(500).json({ error: "Authentication service is currently unavailable." });
        }
    }
});

// ==========================================
// --- 2. CHAT & AI ROUTES ---
// ==========================================

// Translate: @app.route('/new_chat', methods=['POST'])
app.post('/api/chat/new', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Forward to Python to generate a new chat ID in the database
        const pythonResponse = await axios.post(`${PYTHON_SERVICE_URL}/internal/new_chat`, {
            user_id: req.user.userId
        });
        res.json(pythonResponse.data);
    } catch (error: any) {
        // Fallback if Python isn't ready
        res.json({ status: "success", chat_id: `chat_${Date.now()}` });
    }
});

// Translate: @app.route('/get_response', methods=['POST'])
app.post('/api/chat', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
    // Note: Changed 'const' to 'let' so we can assign the new ID!
    let { message, chatId } = req.body;
    const userId = req.user.userId;

    try {
        // --- 1. THE INTERCEPTOR: If React sends null, create a real DB record first! ---
        if (!chatId) {
            console.log(`Creating new DB chat record for user ${userId}...`);
            const newChatResponse = await axios.post(`${PYTHON_SERVICE_URL}/internal/new_chat`, {
                user_id: userId
            });
            
            // Overwrite the null with the actual Database ID Python just created!
            chatId = newChatResponse.data.chat_id; 
        }

        // --- 2. SEND THE MESSAGE ---
        console.log("Sending to Python:", { user_id: userId, chat_id: chatId, message: message });
        const pythonResponse = await axios.post(`${PYTHON_SERVICE_URL}/internal/get_response`, {
            user_id: userId,
            chat_id: chatId, // This is now guaranteed to be a real string/ID!
            message: message
        });

        // --- 3. SEND BACK TO REACT ---
        res.json({
            ...pythonResponse.data,
            chatId: chatId // Send the new ID back so React saves it in Zustand
        });
        
    } catch (error: any) {
        console.error("Python Service Error:", error.message);
        res.status(500).json({ error: "AI Compute Service is currently unavailable." });
    }
});

app.listen(PORT, () => {
    console.log(`[TypeScript Node Gateway] running on http://localhost:${PORT}`);
    console.log(`Routing AI traffic to ${PYTHON_SERVICE_URL}`);
});