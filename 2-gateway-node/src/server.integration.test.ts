import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from './server';
import axios from 'axios';

// Mock axios to simulate Python backend responses
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Gateway API Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =========================================
    // T01: Login - Success (via Gateway)
    // =========================================
    it('T01: POST /api/auth/login - should return JWT token on success', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                success: true,
                user: { id: 1, email: "test@test.com", role: "user", username: "Tester", dark_mode_enabled: false }
            }
        });

        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@test.com', password: 'password123' });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Login successful");
        expect(response.body.token).toBeDefined();
        expect(response.body.email).toBe("test@test.com");
    });

    // =========================================
    // T02: Login - Invalid Password (via Gateway)
    // =========================================
    it('T02: POST /api/auth/login - should return 401 on invalid credentials', async () => {
        mockedAxios.post.mockRejectedValueOnce({
            response: {
                status: 401,
                data: { detail: "Invalid email or password" }
            }
        });

        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'bad@test.com', password: 'wrong' });

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Invalid email or password");
    });

    // =========================================
    // T03: Registration (via Gateway)
    // =========================================
    it('T03: POST /api/auth/register - should register a new user', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: { success: true, dishonesty_detected: false }
        });

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'newuser', email: 'new@test.com', password: 'Secure@123', otp: '123456',
                sex: 'M', age: '30', years_married: '5', children_count: '2',
                children_raised: '1', education: 'bachelor', material_situation: 'good',
                religious_affiliation: 'none', religiousness: '1',
                q13: '2', q17: '1', q19: '3', q20: '3'
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    // =========================================
    // T04: Password Reset (via Gateway)
    // =========================================
    it('T04a: POST /api/auth/forgot-password - should request OTP', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: { success: true, message: "If an account exists, an OTP has been sent." }
        });

        const response = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: 'test@test.com' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    it('T04b: POST /api/auth/reset-password - should reset with valid OTP', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: { success: true, message: "Password updated successfully" }
        });

        const response = await request(app)
            .post('/api/auth/reset-password')
            .send({ email: 'test@test.com', otp: '123456', newPassword: 'NewPass@456' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    // =========================================
    // T21: JWT Authentication Middleware
    // =========================================
    it('T21a: GET /api/users/profile - should return 401 without JWT token', async () => {
        const response = await request(app).get('/api/users/profile');
        
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Access denied. No token provided.");
    });

    it('T21b: GET /api/users/profile - should return 403 with invalid JWT token', async () => {
        const response = await request(app)
            .get('/api/users/profile')
            .set('Authorization', 'Bearer invalid.token.here');
        
        expect(response.status).toBe(403);
        expect(response.body.error).toBe("Invalid or expired token.");
    });

    // =========================================
    // T05: Manage Profile (via Gateway - needs valid token)
    // =========================================
    it('T05: GET /api/faq - should return FAQs (public route)', async () => {
        const mockFaqs = [
            { question: "Is this secure?", answer: "Yes, we use end-to-end encryption." }
        ];
        mockedAxios.get.mockResolvedValueOnce({ data: mockFaqs });

        const response = await request(app).get('/api/faq');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockFaqs);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    // =========================================
    // Admin: requireAdmin middleware
    // =========================================
    it('T17: GET /api/admin/stats - should return 403 for non-admin user', async () => {
        // Generate a valid JWT but with role='user' (not admin)
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_sage_key_2026';
        const userToken = jwt.sign(
            { userId: 1, email: 'user@test.com', role: 'user' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        const response = await request(app)
            .get('/api/admin/stats')
            .set('Authorization', `Bearer ${userToken}`);
        
        expect(response.status).toBe(403);
        expect(response.body.error).toBe("Access denied. Admin role required.");
    });

    it('T16: GET /api/admin/incidents - should return incidents for admin', async () => {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_sage_key_2026';
        const adminToken = jwt.sign(
            { userId: 10, email: 'admin@test.com', role: 'admin' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        const mockIncidents = [
            { id: 1, user_id: 5, risk_level: 2, trigger_keyword: "suicide", status: "open" }
        ];
        mockedAxios.get.mockResolvedValueOnce({ data: mockIncidents });

        const response = await request(app)
            .get('/api/admin/incidents')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockIncidents);
    });

    it('T19: GET /api/admin/feedbacks - should return feedbacks for admin', async () => {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_sage_key_2026';
        const adminToken = jwt.sign(
            { userId: 10, email: 'admin@test.com', role: 'admin' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        const mockFeedback = [
            { id: 1, user_id: 1, rating: 5, comments: "Great session" }
        ];
        mockedAxios.get.mockResolvedValueOnce({ data: mockFeedback });

        const response = await request(app)
            .get('/api/admin/feedbacks')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockFeedback);
    });

    // =========================================
    // T07: Counseling Chat Interaction (via Gateway)
    // =========================================
    it('T07: POST /api/chat - should require authentication', async () => {
        const response = await request(app)
            .post('/api/chat')
            .send({ message: "We keep arguing", chatId: 1 });

        expect(response.status).toBe(401);
    });

    // =========================================
    // T12: Daily Check-In (via Gateway)
    // =========================================
    it('T12: POST /api/checkin - should require authentication', async () => {
        const response = await request(app)
            .post('/api/checkin')
            .send({ coreMetric: 7, unmetNeeds: ["communication"] });

        expect(response.status).toBe(401);
    });

    // =========================================
    // T11: Feedback submission (via Gateway)
    // =========================================
    it('T11: POST /api/feedback - should require authentication', async () => {
        const response = await request(app)
            .post('/api/feedback')
            .send({ chatId: 1, rating: 4, comments: "Good" });

        expect(response.status).toBe(401);
    });

    // =========================================
    // T09: View Session History (via Gateway)
    // =========================================
    it('T09: GET /api/chats - should require authentication', async () => {
        const response = await request(app).get('/api/chats');
        expect(response.status).toBe(401);
    });

    // =========================================
    // T06: Manage User Account - Delete (via Gateway)
    // =========================================
    it('T06: DELETE /api/users/profile - should require authentication', async () => {
        const response = await request(app).delete('/api/users/profile');
        expect(response.status).toBe(401);
    });
});
