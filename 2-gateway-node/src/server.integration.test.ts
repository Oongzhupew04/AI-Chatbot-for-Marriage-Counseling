import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from './server';
import axios from 'axios';

// Mock axios to simulate Python backend responses
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Gateway API Integration Tests', () => {
    beforeEach(() => {
        // Clear all mock data before each test
        jest.clearAllMocks();
    });

    it('GET /api/faq - should return FAQs from Python service', async () => {
        // 1. Mock the Python AI Service response
        const mockFaqs = [
            { question: "Is this secure?", answer: "Yes." }
        ];
        mockedAxios.get.mockResolvedValueOnce({ data: mockFaqs });

        // 2. Perform the test via the Gateway
        const response = await request(app).get('/api/faq');

        // 3. Assertions
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockFaqs);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('GET /api/users/profile - should return 401 without JWT token', async () => {
        // This tests the Security Middleware (authenticateToken) directly
        const response = await request(app).get('/api/users/profile');
        
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Access denied. No token provided.");
    });

    it('POST /api/auth/login - should return 401 on invalid credentials', async () => {
        // 1. Mock the Python AI Service returning a 401 error
        mockedAxios.post.mockRejectedValueOnce({
            response: {
                status: 401,
                data: { detail: "Invalid email or password" }
            }
        });

        // 2. Perform the login attempt
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'bad@test.com', password: 'wrong' });

        // 3. Assertions
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Invalid email or password");
    });

    it('POST /api/auth/login - should return JWT token on success', async () => {
        // 1. Mock a successful Python DB response
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                success: true,
                user: { id: 1, email: "test@test.com", role: "user", username: "Tester", dark_mode_enabled: false }
            }
        });

        // 2. Perform the login attempt
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@test.com', password: 'password123' });

        // 3. Assertions
        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Login successful");
        expect(response.body.token).toBeDefined(); // Verifies JWT was generated
        expect(response.body.email).toBe("test@test.com");
    });
});
