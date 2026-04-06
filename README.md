# 🚀 Orion-X: The AI-Powered Learning Ecosystem

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini%20AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)

**Orion-X** is a cutting-edge Learning Management System (LMS) that leverages Generative AI to transform static PDF modules into interactive, personalized learning experiences. Designed for both students and teachers, it automates the creation of study paths and quizzes while providing an intelligent AI Tutor to answer real-time questions based on course materials.

---

## ✨ Key Features

### 👨‍🏫 For Teachers
*   **Smart Content Ingestion**: Upload PDF modules directly to **Supabase Storage**. The system automatically extracts text using `PyMuPDF`.
*   **AI Quiz Architect**: Generate comprehensive multiple-choice quizzes in seconds based on uploaded notes using **Google Gemini 2.0 Flash**.
*   **Virtual Classrooms**: Launch instant video meetings via **Jitsi Meet** integration.
*   **Performance Analytics**: Gain insights into student performance with automated scoring and analytics.

### 🎓 For Students
*   **Personalized Study Paths**: Get an AI-generated roadmap for every module, including summaries, key terms, and estimated study times.
*   **Interactive AI Tutor**: Chat with an AI that specifically knows *your* course materials (RAG - Retrieval-Augmented Generation).
*   **Real-time Quizzing**: Take timed quizzes and get instant feedback on your progress.
*   **Sleek UI/UX**: Modern, responsive dashboard built with **Framer Motion** for smooth transitions and **Lucide React** for intuitive iconography.

---

## 🛠️ Technical Stack

-   **Frontend**: React 19, Vite, Framer Motion, Axios, Tailwind-ready CSS.
-   **Backend**: FastAPI (Python 3.12), SQLAlchemy (ORM).
-   **AI/ML**: Google Gemini Pro (Generative AI), RAG Implementation for Tutor.
-   **Database**: PostgreSQL hosted on **Supabase**.
-   **Storage**: **Supabase Bucket** (replacing Cloudinary).
-   **Video**: Jitsi Meet Integration.

---

## ⚙️ Installation & Setup (One-Click)

If you just want to run the project without typing any commands:

1.  Clone the repository or download the ZIP from GitHub.
2.  **Make sure you have [Python](https://www.python.org/downloads/) and [Node.js](https://nodejs.org/) installed.**
3.  Double-click the `RUN_ME.bat` file in the main folder.
4.  The script will automatically set up the virtual environment, install dependencies for both frontend and backend, and launch the application!

> [!IMPORTANT]
> **API Keys:** The `.env` file is already included in this repository to make setup zero-config for friends. Please be aware that this means anyone with access to the repo can see your API keys.

---

## 🛠️ Manual CLI Setup (For Developers)

### Prerequisites
- Python 3.9+
- Node.js (v18+)
- PostgreSQL (not needed if using the Supabase remote DB)

### 📦 Backend Setup
1. `cd backend`
2. `python -m venv venv`
3. `venv\Scripts\activate` (Windows)
4. `pip install -r requirements.txt`
5. Create a `.env` file based on `.env.example` and add your API keys.
6. `uvicorn app.main:app --reload`

### 🎨 Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev`

---

## 🧠 Project Architecture

Orion-X follows a decoupled architecture:
1.  **Client-Side**: A state-driven React application that communicates with the API via Axios.
2.  **API-Side**: A high-performance FastAPI server handling business logic, authentication (JWT), and AI orchestrations.
3.  **Data Layer**: A relational PostgreSQL database managed via SQLAlchemy for robust consistency.

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License
This project is licensed under the MIT License.
