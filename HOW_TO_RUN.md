# 🚀 Orion-X Project: Setup Guide

Follow these steps to get the project running on your laptop. Since the credentials and environment files are already included, it will be very easy!

## 1. Prerequisites
Make sure you have the following installed:
*   **Python 3.10 or 3.11** (Check with `python --version`)
*   **Node.js** (Check with `node --version`)
*   **Git**

## 2. Clone the Project
1. Open your terminal or VS Code.
2. Run: `git clone <repository-url>`
3. Run: `cd orion-x`

## 3. One-Click Start (Recommended)
The project includes a `RUN_ME.bat` file in the root directory.
1. Simply **double-click** `RUN_ME.bat`.
2. This script will automatically:
    *   Set up the Python virtual environment.
    *   Install backend dependencies.
    *   Install frontend dependencies.
    *   Start both the Backend and Frontend servers in new windows.

---

## 4. Manual Setup (If `RUN_ME.bat` fails)

### A. Backend Setup
1. Open a terminal in the project root.
2. Create a virtual environment: `python -m venv .venv`
3. Activate it: `.venv\Scripts\activate`
4. Go to backend folder: `cd backend`
5. Install packages: `pip install -r requirements.txt`
6. Run the server: `python -m uvicorn app.main:app --reload`
   *   *Note: Backend will run on `http://localhost:8000`*

### B. Frontend Setup
1. Open a **new** terminal.
2. Go to frontend folder: `cd frontend`
3. Install packages: `npm install`
4. Run the development server: `npm run dev`
   *   *Note: Frontend will run on `http://localhost:5173`*

## 5. Using the App
*   **Frontend**: Open [http://localhost:5173](http://localhost:5173) in your browser.
*   **API Documentation**: Open [http://localhost:8000/docs](http://localhost:8000/docs) to see the backend API.

---
**Note**: If you see a "bcrypt" error, it's already fixed in the latest code you pulled! The project is ready to go.
