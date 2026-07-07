# AI Chatbot for Marriage Counseling

A full-stack, enterprise-grade AI-driven web and mobile application designed to provide secure, intelligent, and responsive marriage counseling services. This system leverages Large Language Models (LLMs) with Retrieval-Augmented Generation (RAG) to provide contextual advice, while strictly maintaining user privacy and safety through advanced risk-detection guardrails.

## 🌟 Key Features

*   **Advanced RAG Pipeline:** Architected using LangChain and `llama-3.3-70b-versatile`. Raw Markdown knowledge bases are processed into vector embeddings using the `BAAI/bge-large-en-v1.5` model, stored and queried via **openGauss DataVec** for highly accurate similarity search.
*   **Hybrid Risk Assessment:** A dual-layer monitoring system combining O(n) regex keyword filtering and HuggingFace semantic vector matching (Cosine Similarity). It instantly detects explicit and nuanced high-risk intents (e.g., abuse, self-harm) before they reach the LLM.
*   **Data Privacy & Security:** 
    *   API Gateway secured with JWT session management and `express-rate-limit` for DDoS protection.
    *   User messages are encrypted using **AES-256**.
    *   Passwords hashed securely via `werkzeug.security`.
    *   Dynamic masking of Personally Identifiable Information (PII) using **SpaCy NLP** and Regex before data is processed by the AI.
*   **Omnichannel Alerting & Cron Scheduling:** A comprehensive notification engine utilizing **Expo Push Notifications** for mobile, **Web Push Notifications** for browsers, and **smtplib** for automated email alerts. Daily partner check-ins are automated using Python **APScheduler** (cron jobs).
*   **Modern State Management:** Highly optimized data caching and state synchronization across web and mobile interfaces using **Zustand** and **TanStack React Query**.

## 🏗️ System Architecture & Tech Stack

This project is built using a microservices architecture, fully containerized with Docker.

*   **Frontend (Web):** React, Vite, Zustand, React Query
*   **Frontend (Mobile):** React Native, Expo
*   **API Gateway:** Node.js, Express, JWT, Multer (Secure File Uploads)
*   **AI Backend:** Python, FastAPI, LangChain, HuggingFace, SpaCy
*   **Database:** openGauss (PostgreSQL) with DataVec extension
*   **Infrastructure:** Docker, Docker Compose, Nginx (Reverse Proxy & Load Balancing)
*   **Deployment:** DigitalOcean VPS

## 🚀 Getting Started (Local Development)

### Prerequisites
*   Docker & Docker Compose
*   Node.js (v18+)
*   Python (3.10+)
*   openGauss database container

### 1. Environment Variables Setup
You will need to configure your environment variables securely. Do **not** commit these to version control.

Create a `.env` file in the `3-ai-service-python` directory:
```env
# 3-ai-service-python/.env
DB_HOST=host.docker.internal
DB_PORT=5432
DB_NAME=ad1
DB_USER=ogc
DB_PASSWORD=your_db_password

# LLM API
GROQ_API_KEY=your_groq_api_key

# Security
AES_ENCRYPTION_KEY=your_base64_aes_key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

*(Note: HuggingFace token is not required as the embedding model used is public).*

### 2. Start the Database
Start the local openGauss database using the provided batch script:
```cmd
.\Start_AI.bat
```
Wait for the terminal to confirm that the backend database and AI bridge are fully online.

### 3. Boot the Microservices
In a new terminal at the root of the project, run:
```bash
docker-compose up --build
```
This will build and start the React Frontend, the Node Gateway, and the Python AI Service.

### 4. Access the Application
Once the containers are running, the services will be available at:
*   **Frontend Web App:** `http://localhost:5173`
*   **Node.js API Gateway:** `http://localhost:3000`
*   **Python AI Service (FastAPI Swagger UI):** `http://localhost:8000/docs`

## 📱 Running the Mobile App
To run the Expo React Native application:
```bash
cd 1-frontend-mobile
npm install
npx expo start
```
Use the Expo Go app on your physical device or an Android/iOS emulator to view the mobile app.

## 🔐 Security Notice
This repository contains advanced security features for handling sensitive PII and emergency scenarios. Ensure you have properly configured the `risk_alert_service` and SMTP credentials if deploying to a production environment. 

## 📄 License
This project is proprietary and confidential.
