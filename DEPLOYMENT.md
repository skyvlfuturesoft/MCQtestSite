# 🚀 Deployment Guide: S.A. Engineering College Examination System

This document outlines the step-by-step instructions to deploy both the **React Frontend** and **FastAPI Backend** to production, fully connected to a production **Supabase Database**.

---

## 🗺️ System Architecture

- **Frontend**: React (Vite) → Deployed to **Vercel** or **Netlify**
- **Backend**: FastAPI (Python) → Deployed to **Render**, **Railway**, or **Fly.io**
- **Database**: PostgreSQL & Real-time Client → Hosted on **Supabase**

---

## 1. 🗄️ Setting Up Supabase (Database & Auth)

1. Go to [Supabase](https://supabase.com/) and create a free account.
2. Create a new project (e.g., `saec-exam-system`).
3. Set up the SQL Database:
   - Navigate to the **SQL Editor** tab in your Supabase dashboard.
   - Click **New Query** and copy the contents of the database schema file located in [migration_v2.sql](file:///c:/Users/Sasikumar%20baskar/Downloads/skyvl_mocktest1/supabase/migration_v2.sql).
   - Click **Run** to execute the script. This will create all necessary tables (`profiles`, `exams`, `questions`, `attempts`, `answers`, `event_logs`, `violations`, `kick_logs`, `activity_logs`, `notifications`, `live_sessions`) and set up constraints.
4. Set up Authentication settings:
   - In Supabase, go to **Authentication** → **Providers** → **Email**.
   - Ensure **Confirm Email** is **disabled** if you want students to register and log in instantly without waiting for email confirmations.

---

## 2. 🐍 Deploying the Backend (FastAPI)

We recommend using **Render** or **Railway** for hosting the Python backend server.

### Option A: Deploying on Render (Free tier available)
1. Push your repository to **GitHub**.
2. Go to [Render](https://render.com/) and click **New** → **Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   - **Environment**: `Python`
   - **Build Command**: `pip install -r requirements.txt` (or if you don't have one, `pip install fastapi uvicorn supabase PyJWT mangum`)
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
5. Go to **Advanced** → **Environment Variables** and add the following keys from your Supabase Project Settings (**Project Settings** → **API**):
   - `SUPABASE_URL` = Your Supabase Project URL
   - `SUPABASE_KEY` = Your Anon/Public API Key
   - `SUPABASE_SERVICE_ROLE_KEY` = Your Service Role Key (crucial for admin capabilities)
   - `IS_MOCK_MODE` = `False` (this tells the backend to connect to your real database instead of using the local mock mode)
6. Click **Deploy Web Service**. Render will build and deploy your backend. Note the public URL generated (e.g., `https://saec-backend.onrender.com`).

---

## 3. ⚛️ Deploying the Frontend (Vite + React)

We recommend using **Vercel** or **Netlify** for hosting static frontend assets.

### Option A: Deploying on Vercel
1. Go to [Vercel](https://vercel.com/) and click **Add New** → **Project**.
2. Import your GitHub repository.
3. Configure the build:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (Root of workspace)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add the Environment Variables:
   - `VITE_API_URL` = The public URL of your deployed backend (e.g. `https://saec-backend.onrender.com` without a trailing slash)
   - `VITE_SUPABASE_URL` = Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = Your Anon/Public API Key
5. Click **Deploy**. Vercel will build and host your web app on a production-ready URL!

---

## 🔒 Security Recommendations

- **JWT Secrets**: The local environment uses `"mock-secret"` for local JWT signing. For a secure production environment, generate a strong random secret key.
- **Service Keys**: Keep your `SUPABASE_SERVICE_ROLE_KEY` secure and never expose it in frontend builds. Only add it as a backend environment variable.
- **CORS Configuration**: In `backend/main.py`, you can restrict allowed CORS origins to your production frontend domain for added security.
