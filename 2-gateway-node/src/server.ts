import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import morgan from 'morgan';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import logger from './utils/logger';

dotenv.config();

const app = express();

// --- RATE LIMITERS ---
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window`
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests from this IP, please try again after 15 minutes" }
});

const chatLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 chat requests per minute to prevent LLM abuse
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "You are sending messages too fast. Please wait a minute." }
});

app.use(globalLimiter);
app.use(express.json());
app.use(cors());
app.use(morgan('dev')); // helps see request logs in the terminal

// Configure multer storage for profile pictures
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/profiles';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Configure multer storage for resources
const resourceStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/resources';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const uploadResource = multer({ storage: resourceStorage });

// Serve static files from 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
// --- AUTHENTICATION ROUTES (PUBLIC ROUTES) ---
// ==========================================

app.post('/api/auth/request-registration-otp', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        const pythonResponse = await axios.post(`${PYTHON_SERVICE_URL}/internal/request-registration-otp`, {
            email: email
        });
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to request registration OTP:", error.message);
        res.status(error.response?.status || 500).json({ error: error.response?.data?.detail || "Could not request OTP" });
    }
});

// Translate: @app.route('/register', methods=['POST'])
app.post('/api/auth/register', async (req: Request, res: Response): Promise<void> => {
    const {
        username, email, password, otp,
        sex, age, years_married, children_count,
        children_raised, education, material_situation,
        religious_affiliation, religiousness,
        q13, q17, q19, q20
    } = req.body;

    try {
        // Forward the registration data to your Python backend to save in openGauss
        const response = await axios.post(`${PYTHON_SERVICE_URL}/internal/register`, {
            username, email, password, otp,
            sex,
            age: parseInt(age),
            years_married: parseInt(years_married),
            children_count: parseInt(children_count),
            children_raised: parseInt(children_raised),
            education,
            material_situation,
            religious_affiliation,
            religiousness: parseInt(religiousness),
            q13, q17, q19, q20
        });

        res.json(response.data);
    } catch (error: any) {
        console.error("Python DB Error:", error.message);
        res.status(error.response?.status || 500).json({ error: error.response?.data?.detail || "Registration failed" });
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

            res.json({ role: user.role, id: user.id, username: user.username, email: user.email, token: token, dark_mode_enabled: user.dark_mode_enabled, message: "Login successful" });
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

app.post('/api/auth/forgot-password', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        const pythonResponse = await axios.post(`${PYTHON_SERVICE_URL}/internal/forgot-password`, {
            email: email
        });
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to request forgot password OTP:", error.message);
        res.status(error.response?.status || 500).json({ error: error.response?.data?.detail || "Could not request OTP" });
    }
});

app.post('/api/auth/reset-password', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp, newPassword } = req.body;
        const pythonResponse = await axios.post(`${PYTHON_SERVICE_URL}/internal/reset-password`, {
            email: email,
            otp: otp,
            new_password: newPassword
        });
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to reset password:", error.message);
        res.status(error.response?.status || 500).json({ error: error.response?.data?.detail || "Could not reset password" });
    }
});

// Get FAQs
app.get('/api/faq', async (req: Request, res: Response): Promise<void> => {
    try {
        const pythonResponse = await axios.get(`${PYTHON_SERVICE_URL}/internal/faq`);
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to fetch FAQs:", error.message);
        res.status(500).json({ error: "Could not load FAQs" });
    }
});

// ==========================================
// --- THE SECURITY GATEWAY ---
// ==========================================
// Every route defined below this line will AUTOMATICALLY require a valid JWT token.
app.use(authenticateToken);

// ==========================================
// --- USER ROUTES (PROTECTED ROUTES) ---
// ==========================================

// Get user profile
app.get('/api/users/profile', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user.userId;
        const pythonResponse = await axios.get(`${PYTHON_SERVICE_URL}/internal/users/${userId}/profile`);
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to fetch user profile:", error.message);
        res.status(error.response?.status || 500).json({ error: "Could not fetch profile" });
    }
});

// Update user profile
app.put('/api/users/profile', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user.userId;
        const pythonResponse = await axios.put(`${PYTHON_SERVICE_URL}/internal/users/${userId}/profile`, req.body);
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to update user profile:", error.message);
        res.status(error.response?.status || 500).json({ error: "Could not update profile" });
    }
});

// Upload user profile picture
app.post('/api/users/profile-pic', upload.single('profile_pic'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user.userId;
        if (!req.file) {
            res.status(400).json({ error: "No file uploaded" });
            return;
        }
        
        // Construct the URL to access the image
        const picUrl = `/uploads/profiles/${req.file.filename}`;
        
        // Tell Python to save this URL
        const pythonResponse = await axios.put(`${PYTHON_SERVICE_URL}/internal/users/${userId}/profile-pic`, { profile_pic: picUrl });
        
        res.json({ success: true, profile_pic: picUrl });
    } catch (error: any) {
        console.error("Failed to upload profile picture:", error.message);
        res.status(error.response?.status || 500).json({ error: "Could not upload profile picture" });
    }
});

// Delete user account
app.delete('/api/users/profile', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user.userId;
        const pythonResponse = await axios.delete(`${PYTHON_SERVICE_URL}/internal/users/${userId}`);
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to delete user account:", error.message);
        res.status(error.response?.status || 500).json({ error: "Could not delete account" });
    }
});

// ==========================================
// --- RESOURCES ROUTES (PROTECTED) ---
// ==========================================

app.get('/api/resources', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const pythonResponse = await axios.get(`${PYTHON_SERVICE_URL}/internal/resources`);
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to fetch resources:", error.message);
        res.status(error.response?.status || 500).json({ error: "Could not fetch resources" });
    }
});

// ==========================================
// --- CHAT & AI ROUTES (PROTECTED ROUTES) ---
// ==========================================

// Translate: @app.route('/new_chat', methods=['POST'])
app.post('/api/chat/new', async (req: AuthRequest, res: Response): Promise<void> => {
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
app.post('/api/chat', chatLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
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
        logger.info("Sending chat request to AI Service", { user_id: userId, chat_id: chatId });
        
        const startTime = Date.now();
        const pythonResponse = await axios.post(`${PYTHON_SERVICE_URL}/internal/get_response`, {
            user_id: userId,
            chat_id: chatId, // This is now guaranteed to be a real string/ID!
            message: message
        });
        const latencyMs = Date.now() - startTime;
        
        logger.info("Received chat response from AI Service", { 
            user_id: userId, 
            chat_id: chatId, 
            latency_ms: latencyMs 
        });

        // --- 3. SEND BACK TO REACT ---
        res.json({
            ...pythonResponse.data,
            chatId: chatId // Send the new ID back so React saves it in Zustand
        });

    } catch (error: any) {
        logger.error("Python Service Error", { error: error.message, stack: error.stack });
        res.status(500).json({ error: "AI Compute Service is currently unavailable." });
    }
});

// Get all sessions for the logged-in user
app.get('/api/chats', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user.userId;
        const pythonResponse = await axios.get(`${PYTHON_SERVICE_URL}/internal/users/${userId}/chats`);
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to fetch chats:", error.message);
        res.status(500).json({ error: "Could not load chats" });
    }
});

// Delete a specific chat session
app.delete('/api/chats/:chatId', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const chatId = req.params.chatId;

        // Forward the delete request to Python
        const pythonResponse = await axios.delete(`${PYTHON_SERVICE_URL}/internal/chats/${chatId}`);

        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to delete chat:", error.message);
        res.status(500).json({ error: "Could not delete chat session" });
    }
});

// Mark session as ended
app.post('/api/chats/:chatId/end', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const chatId = req.params.chatId;
        const pythonResponse = await axios.post(`${PYTHON_SERVICE_URL}/internal/chats/${chatId}/end`);
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to end chat:", error.message);
        res.status(500).json({ error: "Could not end chat session" });
    }
});

// Get message history for a specific session
app.get('/api/chats/:chatId/messages', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const chatId = req.params.chatId;
        const pythonResponse = await axios.get(`${PYTHON_SERVICE_URL}/internal/chats/${chatId}/messages`);
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to fetch messages:", error.message);
        res.status(500).json({ error: "Could not load message history" });
    }
});

// Translate: @app.route('/checkin', methods=['POST'])
app.post('/api/checkin', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user.userId;
        const checkinData = req.body;

        console.log(`Receiving Daily Check-in from user ${userId}...`);

        // Forward the check-in data to your Python backend (which will save it to the DB)
        const pythonResponse = await axios.post(`${PYTHON_SERVICE_URL}/internal/checkin`, {
            user_id: userId,
            ...checkinData
        });

        res.json({ success: true, data: pythonResponse.data });
    } catch (error: any) {
        console.error("Failed to save check-in:", error.message);
        // Fallback response if Python isn't ready to receive it yet
        res.status(500).json({ error: "Could not save daily check-in to database." });
    }
});

app.post('/api/feedback', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user.userId;
        const chatId = req.body.chatId;
        const feedbackData = req.body;

        console.log(`Receiving Feedback from user ${userId}...`);

        const pythonResponse = await axios.post(`${PYTHON_SERVICE_URL}/internal/feedback`, {
            user_id: userId,
            chatId: chatId,
            ...feedbackData
        });

        res.json({ success: true, data: pythonResponse.data });
    } catch (error: any) {
        console.error("Failed to save feedback:", error.message);
        res.status(500).json({ error: "Could not save feedback." });
    }
});

// Translate: GET /analysis
app.get('/api/analysis', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user.userId;
        const pythonResponse = await axios.get(`${PYTHON_SERVICE_URL}/internal/users/${userId}/analysis`);
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to fetch analysis data:", error.message);
        res.status(500).json({ error: "Could not load analysis data" });
    }
});

// Save Push Subscription
app.post('/api/settings/push-subscription', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user.userId;
        const subData = req.body;
        
        // Extract endpoints and keys
        const endpoint = subData.endpoint;
        const p256dh = subData.keys?.p256dh;
        const auth = subData.keys?.auth;

        const pythonResponse = await axios.post(`${PYTHON_SERVICE_URL}/internal/settings/push-subscription`, {
            user_id: userId,
            endpoint: endpoint,
            p256dh: p256dh,
            auth: auth
        });
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to save push subscription:", error.message);
        res.status(500).json({ error: "Could not save subscription" });
    }
});

// Get user preferences
app.get('/api/settings/preferences', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user.userId;
        const pythonResponse = await axios.get(`${PYTHON_SERVICE_URL}/internal/settings/preferences/${userId}`);
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to fetch preferences:", error.message);
        res.status(error.response?.status || 500).json({ error: "Could not fetch preferences" });
    }
});

// Update Push Preferences
app.put('/api/settings/preferences', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user.userId;
        const { pushEnabled } = req.body;

        const pythonResponse = await axios.put(`${PYTHON_SERVICE_URL}/internal/settings/preferences`, {
            user_id: userId,
            enabled: pushEnabled
        });
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to update preferences:", error.message);
        res.status(500).json({ error: "Could not update preferences" });
    }
});

// Update Dark Mode Preference
app.put('/api/settings/darkmode', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user.userId;
        const { darkModeEnabled } = req.body;

        const pythonResponse = await axios.put(`${PYTHON_SERVICE_URL}/internal/settings/darkmode`, {
            user_id: userId,
            enabled: darkModeEnabled
        });
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to update dark mode preferences:", error.message);
        res.status(500).json({ error: "Could not update dark mode preferences" });
    }
});

// Request OTP for Password Change
app.post('/api/settings/request-otp', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user.userId;
        const pythonResponse = await axios.post(`${PYTHON_SERVICE_URL}/internal/settings/request-otp`, {
            user_id: userId
        });
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to request OTP:", error.message);
        res.status(error.response?.status || 500).json({ error: error.response?.data?.detail || "Could not request OTP" });
    }
});

// Change Password
app.put('/api/settings/change-password', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user.userId;
        const { currentPassword, newPassword, otp } = req.body;

        const pythonResponse = await axios.put(`${PYTHON_SERVICE_URL}/internal/settings/change-password`, {
            user_id: userId,
            current_password: currentPassword,
            new_password: newPassword,
            otp: otp
        });
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to change password:", error.message);
        res.status(error.response?.status || 500).json({ error: error.response?.data?.detail || "Could not change password" });
    }
});

// ==========================================
// --- ADMIN ROUTES ---
// ==========================================

// Ensure admin endpoints are only accessible by admin, though for now we just proxy
const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: "Access denied. Admin role required." });
    }
};

app.get('/api/admin/stats', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const pythonResponse = await axios.get(`${PYTHON_SERVICE_URL}/internal/admin/stats`);
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to fetch admin stats:", error.message);
        res.status(500).json({ error: "Could not fetch admin stats" });
    }
});

app.get('/api/admin/feedbacks', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const pythonResponse = await axios.get(`${PYTHON_SERVICE_URL}/internal/admin/feedbacks`);
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to fetch admin feedbacks:", error.message);
        res.status(500).json({ error: "Could not fetch admin feedbacks" });
    }
});

app.get('/api/admin/incidents', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const pythonResponse = await axios.get(`${PYTHON_SERVICE_URL}/internal/admin/incidents`);
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to fetch admin incidents:", error.message);
        res.status(500).json({ error: "Could not fetch admin incidents" });
    }
});

app.get('/api/admin/incidents/all', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const pythonResponse = await axios.get(`${PYTHON_SERVICE_URL}/internal/admin/incidents/all`);
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to fetch all admin incidents:", error.message);
        res.status(500).json({ error: "Could not fetch all admin incidents" });
    }
});

app.put('/api/admin/incidents/:id/resolve', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const incidentId = req.params.id;
        const pythonResponse = await axios.put(`${PYTHON_SERVICE_URL}/internal/admin/incidents/${incidentId}/resolve`);
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to resolve incident:", error.message);
        res.status(error.response?.status || 500).json({ error: error.response?.data?.detail || "Could not resolve incident" });
    }
});

app.post('/api/admin/incidents/:id/contact', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const incidentId = req.params.id;
        const { user_id, message } = req.body;
        const pythonResponse = await axios.post(`${PYTHON_SERVICE_URL}/internal/admin/incidents/${incidentId}/contact`, {
            user_id: user_id,
            message: message
        });
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to contact user:", error.message);
        res.status(error.response?.status || 500).json({ error: error.response?.data?.detail || "Could not contact user" });
    }
});

app.post('/api/admin/resources', requireAdmin, uploadResource.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { title, description, category, url } = req.body;
        
        let finalUrl = url;
        // If a file was uploaded, construct its local URL
        if (req.file) {
            finalUrl = `/uploads/resources/${req.file.filename}`;
        }
        
        const pythonResponse = await axios.post(`${PYTHON_SERVICE_URL}/internal/admin/resources`, {
            title: title,
            description: description,
            category: category,
            url: finalUrl || '#'
        });
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to add resource:", error.message);
        res.status(error.response?.status || 500).json({ error: error.response?.data?.detail || "Could not add resource" });
    }
});

app.delete('/api/admin/resources/:id', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const resourceId = req.params.id;
        
        // Fetch resource to get the URL for local deletion
        try {
            const getRes = await axios.get(`${PYTHON_SERVICE_URL}/internal/resources`);
            if (getRes.data.success) {
                const resource = getRes.data.resources.find((r: any) => r.id == resourceId);
                if (resource && resource.url && resource.url.includes('/uploads/resources/')) {
                    const filename = resource.url.split('/').pop();
                    if (filename) {
                        const filePath = path.join(__dirname, '..', 'uploads', 'resources', filename);
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                            console.log(`Deleted local resource file: ${filename}`);
                        }
                    }
                }
            }
        } catch (fetchErr) {
            console.error("Failed to fetch resource for file deletion. Continuing with DB deletion.", fetchErr);
        }

        const pythonResponse = await axios.delete(`${PYTHON_SERVICE_URL}/internal/admin/resources/${resourceId}`);
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to delete resource:", error.message);
        res.status(error.response?.status || 500).json({ error: error.response?.data?.detail || "Could not delete resource" });
    }
});

app.get('/api/admin/users', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const pythonResponse = await axios.get(`${PYTHON_SERVICE_URL}/internal/admin/users`);
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to fetch admin users:", error.message);
        res.status(500).json({ error: "Could not fetch admin users" });
    }
});

app.put('/api/admin/users/:id/freeze', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.params.id;
        const pythonResponse = await axios.put(`${PYTHON_SERVICE_URL}/internal/admin/users/${userId}/freeze`);
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to freeze user:", error.message);
        res.status(error.response?.status || 500).json({ error: error.response?.data?.detail || "Could not freeze user" });
    }
});

app.post('/api/admin/users/:id/reset-password', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.params.id;
        const pythonResponse = await axios.post(`${PYTHON_SERVICE_URL}/internal/admin/users/${userId}/reset-password`);
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to reset user password:", error.message);
        res.status(error.response?.status || 500).json({ error: error.response?.data?.detail || "Could not reset password" });
    }
});

app.delete('/api/admin/users/:id', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.params.id;
        
        // Fetch user to get profile picture URL for local deletion
        try {
            const getRes = await axios.get(`${PYTHON_SERVICE_URL}/internal/admin/users`);
            if (getRes.data.success) {
                const user = getRes.data.users.find((u: any) => u.id == userId);
                if (user && user.profile_picture && user.profile_picture.includes('/uploads/profiles/')) {
                    const filename = user.profile_picture.split('/').pop();
                    if (filename) {
                        const filePath = path.join(__dirname, '..', 'uploads', 'profiles', filename);
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                            console.log(`Deleted local profile picture: ${filename}`);
                        }
                    }
                }
            }
        } catch (fetchErr) {
            console.error("Failed to fetch user for file deletion. Continuing with DB deletion.", fetchErr);
        }

        const pythonResponse = await axios.delete(`${PYTHON_SERVICE_URL}/internal/admin/users/${userId}`);
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to delete user account:", error.message);
        res.status(error.response?.status || 500).json({ error: error.response?.data?.detail || "Could not delete user" });
    }
});

// Admin Add FAQ
app.post('/api/admin/faqs', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { question, answer } = req.body;
        const pythonResponse = await axios.post(`${PYTHON_SERVICE_URL}/internal/admin/faqs`, {
            question,
            answer
        });
        res.json(pythonResponse.data);
    } catch (error: any) {
        console.error("Failed to add FAQ:", error.message);
        res.status(500).json({ error: "Could not add FAQ" });
    }
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`[TypeScript Node Gateway] running on http://localhost:${PORT}`);
        console.log(`Routing AI traffic to ${PYTHON_SERVICE_URL}`);
    });
}

export default app;