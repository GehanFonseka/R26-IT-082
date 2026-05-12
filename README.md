# 🤖 AI-Powered Intelligent Talent Acquisition System

An advanced AI-driven recruitment platform designed to automate and enhance the entire hiring lifecycle — from job posting to final hiring decisions — using intelligent data processing and machine learning models.

---

## 📌 Overview

The system enables organizations to streamline recruitment by integrating multiple AI modules into a unified pipeline. It improves:

* ⚡ Hiring speed
* 🎯 Candidate-job matching accuracy
* 📊 Decision transparency (Explainable AI)
* 📉 Employee attrition risk reduction

---

## 🚀 Key Features

### 👩‍💼 Recruiter (HR Panel)

* Create & manage job vacancies
* View applicants with AI ranking
* Access interview results & analytics
* Monitor candidate risk predictions
* Make data-driven hiring decisions

---

### 👨‍💻 Candidate Portal

* Register & manage profile
* Upload CV (PDF/DOCX)
* Apply for jobs
* Attend AI-based interviews
* Track application status

---

### 🛠 Admin Panel

* Manage users (HR & Candidates)
* Monitor system performance
* View reports & logs
* Control system permissions

---

## 🧠 Core AI Modules

### 1️⃣ Intelligent Resume Parsing & Skill Analysis

* Extracts structured data from resumes
* Identifies skills, experience, education
* Calculates skill proficiency levels

---

### 2️⃣ Job–Candidate Matching & Explainable AI

* Computes candidate-job match score
* Uses ML models for ranking
* Provides explanation for decisions

---

### 3️⃣ AI-Based Interview Evaluation

* Evaluates candidate responses
* Analyzes communication & confidence
* Supports text, MCQ, and video interviews

---

### 4️⃣ Hiring Risk & Attrition Prediction

* Predicts likelihood of early resignation
* Generates risk scores (Low / Medium / High)
* Helps avoid poor hiring decisions

---

## 🏗 System Architecture

```text
Input Layer (CVs, Job Descriptions, Metadata)
        ↓
Data Ingestion & Preprocessing
        ↓
AI Modules (4 Models Pipeline)
        ↓
MongoDB Database
        ↓
Decision Support Dashboard
```

---

## 🔄 System Workflow

```text
HR Creates Vacancy
        ↓
Candidate Applies
        ↓
Resume Upload & Parsing
        ↓
AI Matching Score
        ↓
Shortlisting
        ↓
AI Interview Evaluation
        ↓
Risk Prediction
        ↓
Recruiter Dashboard
        ↓
Final Hiring Decision
```

---

## ⚙️ Tech Stack

### Frontend

* React.js
* Tailwind CSS
* Recharts

### Backend

* Node.js (Express.js) / FastAPI
* REST APIs
* JWT Authentication

### Database

* MongoDB

### AI / Machine Learning

* Python
* Scikit-learn
* XGBoost
* NLP (spaCy, Transformers)
* SHAP / LIME (Explainable AI)

---

## 📂 Project Structure

```text
/frontend
  /components
  /pages
  /services

/backend
  /controllers
  /models
  /routes
  /services
  /ai-modules
```

---

## 🔐 Security Features

* JWT-based authentication
* Role-based access control
* Secure password hashing (bcrypt)
* Protected API routes

---

## 📊 Dashboard Insights

* Candidate ranking system
* Skill analysis visualization
* Interview performance metrics
* Risk prediction indicators
* Hiring analytics

---

## 📦 Installation & Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/GehanFonseka/R26-IT-082.git
```

---

### 2️⃣ Backend Setup

```bash
cd backend
npm install
npm run dev
```

---

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm start
```

---

## 🌐 Environment Variables

### Backend (.env)

```text
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
```

### Frontend (.env)

```text
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 📈 Future Enhancements

* Real-time video interview analysis
* Emotion & facial expression detection
* LinkedIn API integration
* Multi-language support
* Cloud deployment (AWS / Azure)

---

## 🎯 Research Contributions

* Explainable AI in recruitment systems
* Automated interview intelligence
* Predictive hiring risk analysis
* End-to-end intelligent hiring pipeline

---

## 👥 Contributors

* Gehan Fonseka
* Chamudi Himasha
* Kavishka Deshan
* Sajani Sapurna
---

## 📄 License

This project is developed for academic and research purposes.

---

⭐ *If you found this project useful, consider giving it a star!*
