# Orion-X Project Setup Guide

This guide will help you set up and run the **Orion-X** project on your local machine.

## Prerequisites
Before you begin, ensure you have the following installed:
- [Python 3.9+](https://www.python.org/downloads/)
- [Node.js (v18+)](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/download/)

---

## 1. Backend Setup (FastAPI)

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create a virtual environment:**
    ```bash
    python -m venv venv
    ```

3.  **Activate the virtual environment:**
    - **Windows:** `venv\Scripts\activate`
    - **Mac/Linux:** `source venv/bin/activate`

4.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Environment Variables:**
    - Create a file named `.env` in the `backend/` folder.
    - Copy the contents from `.env.example` and fill in your details (Database credentials, API keys).

6.  **Database Setup:**
    - Ensure PostgreSQL is running.
    - Create a database named `orion_db` (or whatever you specify in `.env`).

7.  **Run the Backend:**
    ```bash
    uvicorn app.main:app --reload
    ```
    The backend will be available at `http://127.0.0.1:8000`.

---

## 2. Frontend Setup (React + Vite)

1.  **Navigate to the frontend directory:**
    ```bash
    cd ../frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the Frontend:**
    ```bash
    npm run dev
    ```
    The frontend will be available at `http://localhost:5173`.

---

## 3. How to Share this Project

### Option A: GitHub (Recommended)
1.  Create a new repository on GitHub.
2.  Initialize git in this folder: `git init`
3.  Add all files: `git add .` (The `.gitignore` files will automatically exclude large folders like `node_modules` and `venv`).
4.  Commit: `git commit -m "Initial commit"`
5.  Push to GitHub.
6.  Your friend can then run `git clone <repository_url>` and follow this guide.

### Option B: Zip File
If you send a Zip file, **DELETE** these folders first to keep the file size small:
- `backend/venv/`
- `frontend/node_modules/`
- `frontend/dist/`
Your friend will recreate them using the install commands above.
