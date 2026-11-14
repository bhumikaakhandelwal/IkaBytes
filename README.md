# IkaBytes — SkillMatch: AI Placement Accelerator & Skills Intelligence

A full-stack placement intelligence platform connecting students with corporate recruiters and Training & Placement Officers (TPO). SkillMatch uses automated resume parsing, skill matching algorithms, and LLM-powered insights to match candidates to job openings, identify skill gaps, and streamline campus placements.

---

## 🛠️ Technology Stack

### Frontend
- **Framework & Runtime**: React 18 (`react`, `react-dom`)
- **Build Tool & Dev Server**: Vite 6 (`@vitejs/plugin-react`)
- **Icons**: Lucide React (`lucide-react`)
- **Styling**: Modern responsive CSS design system (`styles.css`)
- **Session Management**: Tab-isolated authentication via `sessionStorage` (enables simultaneous multi-role sessions)

### Backend
- **Runtime**: Node.js (v18+)
- **Server Framework**: Express 4 (`express`)
- **Database & ODM**: MongoDB with Mongoose 8 (`mongoose`)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs` password hashing
- **File Uploads**: Multer (`multer`) for multipart resume ingestion
- **Resume Text Extraction**:
  - `pdf-parse`: PDF document parsing
  - `mammoth`: DOCX/DOC document text extraction
  - Native `node:fs/promises`: Plain text resume parsing
- **CORS & Environment**: `cors`, `dotenv`
- **AI / LLM Integration**: Groq Cloud API (`openai/gpt-oss-120b`) for automated resume analysis and career suggestions

---

## ✨ Features

### 1. Student Dashboard (`src/StudentDashboard.jsx`)
- **Profile Management**: Persists full name, academic CGPA (0–10 scale validation), department selection, LinkedIn URL, and dynamic project links directly to MongoDB.
- **Resume Parsing & Skill Extraction**: Supports PDF, DOCX, and TXT resumes (up to 5 MB); parses text and automatically identifies known technical skills.
- **Market Pulse**: Real-time visualization of the most in-demand skills required across all open job postings.
- **Opportunities Explorer**: Search jobs by title, company, skills, or department, with quick status filters (**All**, **Open**, and **Closed/Filled**).

### 2. Placement Officer (TPO) Dashboard (`src/TpoDashboard.jsx`)
- **Role Posting**: Create job openings with role title, company, eligible department (or Open to All), CGPA cutoffs, description, and required skills.
- **Live Shortlists**: AI-assisted candidate rankings calculated in real time against job briefs.
- **Interactive Candidate Leaderboard**: Detailed candidate breakdown with skill overlap matching, match scores, and qualification badges.
- **Shortlist Actions**: One-click toggling to shortlist/un-shortlist students for interviews.
- **Role Status Management**: Reopen or close filled positions at any time.
- **Export & Reporting**: Print or export candidate leaderboards directly from the browser.

### 3. AI-Powered Career Insights (`server/src/services/insights.js`)
- Compares student resumes against active job briefs via Groq LLM.
- Generates tailored strengths, skill gaps, actionable suggestions, and job fit explanations.
- Features in-memory fingerprint caching and debouncing to prevent redundant API calls.

### 4. Independent Per-Tab Sessions
- Utilizes `sessionStorage` token management so that different browser tabs can operate as different accounts/roles simultaneously (e.g., Student in Tab 1, TPO in Tab 2) without session bleed.

---

## 📦 Dependencies

### Root (Frontend) Dependencies
```json
{
  "dependencies": {
    "lucide-react": "^0.468.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.0.5"
  }
}
```

### Backend (`server/`) Dependencies
```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.2",
    "mammoth": "^1.13.0",
    "mongoose": "^8.9.5",
    "multer": "^2.0.2",
    "pdf-parse": "^2.4.5"
  }
}
```

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017/skillmatch`) or a MongoDB Atlas connection string
- **Groq API Key** *(optional, for AI insights)*: [Get a free key from Groq Console](https://console.groq.com/keys)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/<your-username>/IkaBytes.git
cd IkaBytes
```

---

### Step 2: Configure & Start the Backend Server

1. Navigate to the `server` directory and install dependencies:
   ```bash
   cd server
   npm install
   ```

2. Create an environment file `.env` by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your configuration:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/skillmatch
   JWT_SECRET=your-secure-random-jwt-secret-key-2026
   JWT_EXPIRES_IN=7d
   CLIENT_ORIGIN=http://localhost:5173
   
   GROQ_API_KEY=gsk_your_groq_api_key_here
   GROQ_MODEL=openai/gpt-oss-120b
   GROQ_BASE_URL=https://api.groq.com/openai/v1
   AI_DAILY_LIMIT_PER_STUDENT=5
   ```

4. *(Optional)* Seed the database with sample roles and student profiles:
   ```bash
   npm run seed
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   # Server runs on http://localhost:5000
   ```

---

### Step 3: Configure & Start the Frontend

1. In a **new terminal**, navigate to the project root directory:
   ```bash
   cd c:\Users\NIRAT NAYAK\Desktop\Ikabytes\IkaBytes
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   # Vite dev server runs on http://localhost:5173
   ```
   *(Vite automatically proxies `/api` calls to `http://localhost:5000`)*.

---

## 🧪 Steps Required to Run and Test the Solution

### 1. Verification of Build & Health
- **Frontend Build Test**: Run `npm run build` in the root folder to ensure all React components, icons, and CSS compile cleanly without errors.
- **Backend Health Check**: Open `http://localhost:5000/api/health` in your browser or run:
  ```bash
  curl http://localhost:5000/api/health
  # Response: {"status":"ok","database":"connected"}
  ```
- **AI Service Test**: Run `npm run test:ai` from the `server/` directory to verify Groq API connectivity and response parsing.

### 2. Testing Multi-Role Independent Sessions
1. Open `http://localhost:5173` in **Tab 1**:
   - Sign in as a **Student** (e.g. `aarav@college.edu` / `password123` or register a new student account).
   - Update your profile (CGPA, department, LinkedIn, project links), upload a resume (PDF/DOCX/TXT), and observe the detected skills and market pulse.
2. Open `http://localhost:5173` in **Tab 2** (a separate tab):
   - Sign in as a **Placement Officer** (e.g. `officer@college.edu` / `password123`).
   - Post a new role with required skills and CGPA cutoffs.
   - Click **"View full shortlist & candidate ranking"** to inspect the Leaderboard.
   - Toggle candidate shortlists and reopen/close the role.
3. Refresh both tabs: each tab preserves its distinct user role and data without session crossover.

---

## 🔑 Demo Accounts (After `npm run seed`)

| Role | Email | Password |
|---|---|---|
| **Placement Officer** | `officer@college.edu` | `password123` |
| **Student (CS)** | `aarav@college.edu` | `password123` |
| **Student (IT)** | `mira@college.edu` | `password123` |
| **Student (CS)** | `rohan@college.edu` | `password123` |
| **Student (EC)** | `sana@college.edu` | `password123` |

---

## 📡 REST API Reference

All protected endpoints require the header `Authorization: Bearer <token>`.

### Authentication
| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user: `{ email, password, role: 'student'\|'tpo', name }` |
| `POST` | `/api/auth/login` | Public | User login: `{ email, password, role? }` |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile |

### Student Profile & Resume
| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/profile/me` | Student | Get authenticated student's profile & parsed skills |
| `PUT` | `/api/profile/me` | Student | Update profile (`name`, `department`, `cgpa`, `linkedin`, `projects`) |
| `POST` | `/api/profile/me/resume` | Student | Upload resume multipart form (`.pdf`, `.docx`, `.doc`, `.txt`) |
| `GET` | `/api/profile/:userId/resume` | Owner / TPO | Download / stream resume document |

### Jobs & Leaderboards
| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/jobs` | Authenticated | List jobs (supports query `?q=`, students see Open only) |
| `POST` | `/api/jobs` | TPO | Create a new job opening |
| `PATCH` | `/api/jobs/:id` | TPO | Edit job details or change status (`status: 'Closed'`) |
| `DELETE`| `/api/jobs/:id` | TPO | Remove a job posting |
| `GET` | `/api/jobs/shortlists` | TPO | Top candidate matches across all open jobs |
| `GET` | `/api/jobs/:id/leaderboard` | Authenticated | Candidate leaderboard ranked by skill match score |

### Market & Applications
| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/jobs/:id/apply` | Student | Apply to a job posting |
| `GET` | `/api/jobs/:id/applications`| TPO | View applicant list for a job |
| `GET` | `/api/applications/me` | Student | View current student's applications |
| `PATCH` | `/api/applications/:id` | TPO | Update application status (`applied`, `shortlisted`, `rejected`, `selected`) |
| `GET` | `/api/market/demand` | Authenticated | Most demanded skills across active job postings |

---

## 📄 License
This project is licensed under the MIT License.
