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
*   [Docker & Docker Compose](https://docs.docker.com/get-docker/) (required)
*   Node.js (v18+) — only needed for mobile app development

### 1. Clone & Configure Environment Variables
```bash
git clone https://github.com/YOUR_USERNAME/AI-Chatbot-for-Marriage-Counseling.git
cd AI-Chatbot-for-Marriage-Counseling

# Copy the environment template and fill in your own values
cp .env.example .env
```
Edit the `.env` file with your own API keys and credentials. The default database password (`Changeme@123`) works out of the box for local development.

### 2. Start Everything (One Command)
```bash
docker-compose up --build
```
This single command will:
1.  **Pull & build the openGauss database** container with the full schema auto-initialized
2.  **Build and start** the React Frontend, Node.js Gateway, and Python AI Service
3.  **Connect all services** together automatically via Docker networking

> ☕ First run takes a few minutes to download images and build. Subsequent runs are much faster.

### 3. Access the Application
Once the containers are running, the services will be available at:
*   **Frontend Web App:** `http://localhost:5173`
*   **Node.js API Gateway:** `http://localhost:3000`
*   **Python AI Service (FastAPI Swagger UI):** `http://localhost:8000/docs`

### 4. Connect to the Database (Optional)
You can connect to the openGauss database using any **PostgreSQL-compatible** DBMS tool (e.g., DBeaver, pgAdmin, DataGrip):

| Setting    | Value              |
|------------|--------------------|
| **Host**   | `localhost`        |
| **Port**   | `5432`             |
| **Database** | `ad1`            |
| **Username** | `ogc`            |
| **Password** | Your `DB_PASSWORD` from `.env` |
| **Driver** | PostgreSQL         |


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
