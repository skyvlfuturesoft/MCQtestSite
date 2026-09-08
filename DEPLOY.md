# SOEMS — Full Deployment Guide (Supabase, Vercel & Firebase)

Follow these step-by-step instructions to deploy your Secure Online Examination Management System with full functionality.

---

## 1. Database Setup (Supabase)

1. **Create a Supabase Project**: Go to [Supabase Console](https://supabase.com) and create a new project.
2. **Retrieve Connection Keys**:
   - Go to **Settings > API** and copy:
     - `Project URL`
     - `anon public` api key
     - `service_role` secret api key (JWT auth bypass)
     - `JWT Secret`
3. **Initialize Database Tables**:
   - Navigate to the **SQL Editor** in Supabase.
   - Click **New Query** and copy-paste the contents of the database migration file:
     - First, run [migration.sql](file:///c:/Users/Sasikumar%20baskar/Downloads/skyvl_mocktest1/supabase/migration.sql) to set up core tables (profiles, exams, questions, attempts, answers, event_logs).
     - Second, run [migration_v2.sql](file:///c:/Users/Sasikumar%20baskar/Downloads/skyvl_mocktest1/supabase/migration_v2.sql) to add the advanced proctoring, violations, live_sessions, and kick logs tables.
4. **Enable Realtime**:
   - Ensure the Realtime publication includes `attempts` and `event_logs` tables (handled automatically if you run `migration_v2.sql`).

---

## 2. Backend Deployment (Vercel)

The backend uses **FastAPI** wrapped with the **Mangum** adapter for AWS Lambda/Vercel serverless deployment.

1. **Verify vercel.json configuration**:
   - Ensure you have a `vercel.json` file in your workspace root configured as follows:
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "/api/main.py" }
     ]
   }
   ```
2. **Vercel Folder Structure**:
   - Vercel serverless Python looks for functions inside the `/api` folder.
   - Since Vercel executes `/api/main.py` directly, ensure your backend files are placed or rewrote appropriately. (For Vercel native Python routing, placing `main.py` inside an `api` directory at the project root is recommended).
3. **Environment Variables**:
   - Go to your Vercel Project dashboard **Settings > Environment Variables** and add:
     - `SUPABASE_URL` = (your Supabase URL)
     - `SUPABASE_KEY` = (your Supabase anon key)
     - `SUPABASE_SERVICE_KEY` = (your Supabase service_role key - *Required to enable real database mode*)
     - `SUPABASE_JWT_SECRET` = (your Supabase JWT Secret)

---

## 3. Frontend Deployment (Firebase Hosting)

The frontend is a static single-page React app bundled with Vite.

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```
2. **Build for Production**:
   - Set up your `.env` env file to point to your live Vercel backend API:
     ```env
     VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
     VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
     VITE_API_URL=https://your-vercel-backend-domain.vercel.app
     ```
   - Compile the static bundle:
     ```bash
     npm run build
     ```
3. **Initialize & Deploy**:
   - Login to Firebase:
     ```bash
     firebase login
     ```
   - Initialize hosting:
     ```bash
     firebase init hosting
     ```
     - Choose your project.
     - Specify the public directory as `dist` (since Vite outputs build to `dist`).
     - Configure as a single-page app (write `Yes` to rewrite all URLs to `/index.html`).
   - Run deployment:
     ```bash
     firebase deploy --only hosting
     ```

---

## E2E Proctoring Verification Checklist

After deploying, verify the live app using these test flows:
1. **Rule Enforcement**: Student tabs away from exam → Strike warning modal pops up.
2. **Auto-kick**: Student tabs away 3 times → Kicked immediately to Exam Terminated page.
3. **Live Sync**: Admin opens dashboard → Live Monitor table displays student status and current answers real-time.
