# SkillMatch API

Express + MongoDB (Mongoose) backend for the SkillMatch frontend.

## Setup

```bash
cd server
npm install
cp .env.example .env      # then fill in MONGODB_URI and JWT_SECRET
npm run seed              # optional: demo officer, 4 students, 5 jobs (clears existing data)
npm run dev               # http://localhost:5000
```

In a second terminal, from the project root: `npm run dev` (Vite proxies `/api` to port 5000).

Demo logins after seeding (password `password123`):
- Officer: `officer@college.edu`
- Students: `aarav@college.edu`, `mira@college.edu`, `rohan@college.edu`, `sana@college.edu`

## Endpoints

All routes except register/login need `Authorization: Bearer <token>`.

| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | /api/auth/register | public | `{ email, password, role: 'student'\|'tpo', name }` |
| POST | /api/auth/login | public | `{ email, password, role? }` → `{ token, user }` |
| GET | /api/auth/me | any | Current user |
| GET / PUT | /api/profile/me | student | Read / update profile (name, department, cgpa, linkedin, skills, certifications, projects) |
| POST | /api/profile/me/resume | student | multipart field `resume` (PDF/DOC/DOCX/TXT, 5 MB) |
| GET | /api/profile/:userId/resume | owner or tpo | Download resume |
| GET | /api/jobs?q= | any | List jobs (students see Open only) |
| POST | /api/jobs | tpo | `{ title, company, description, skills, minCgpa? }` |
| PATCH / DELETE | /api/jobs/:id | tpo | Edit, close (`status: 'Closed'`) or delete |
| GET | /api/jobs/shortlists?limit=3 | tpo | Top candidates for every open job, one call |
| GET | /api/jobs/:id/leaderboard | any | Ranked candidates (other students anonymised for student viewers) |
| POST | /api/jobs/:id/apply | student | Apply to a role |
| GET | /api/jobs/:id/applications | tpo | Applications for a role |
| GET | /api/applications/me | student | My applications |
| PATCH | /api/applications/:id | tpo | `{ status: applied\|shortlisted\|rejected\|selected }` |
| GET | /api/market/demand | any | Most-requested skills across open jobs |

## Match score (built-in)

- Required-skill overlap: up to 70
- Projects: 5 each (max 3) · Certifications: 5 each (max 2)
- CGPA: (cgpa / 10) × 5
- Below a job's minimum CGPA → score capped at 50

Set `AI_SERVICE_URL` to use the Python/FastAPI ranker instead (contract in `src/services/matching.js`); it falls back to the built-in scorer if the service is down.

## Placement officer: Students & Skill gaps (TPO only)

| Method | Path | Purpose |
|---|---|---|
| GET | /api/students?q=&department=&minCgpa=&skill=&hasResume=1&sort=name\|cgpa\|updated&page=1 | Student directory (20 per page) |
| GET | /api/students/:id | Full profile, fit for every open role, applications, shortlists |
| GET | /api/students/:id/resume | Resume file (PDFs open in the browser) |
| GET | /api/analytics/skill-gaps?department=&scope=eligible\|all&includeClosed=1 | Skills the roles need vs. students who don't show them |
| GET | /api/analytics/skill-gaps/:skill/students | Students who don't show a skill (for invites / CSV) |

Skill names are standardised (`services/skills.js` → `SKILL_ALIASES`), so "nodejs", "Node JS" and "Node.js"
count as the same skill everywhere. Add your own spellings to that list as needed.

## Notes

- CGPA is self-reported (honor system).
- Only `.txt` resumes are parsed for skills right now. PDF/DOCX are stored; parse them in the AI service or add `pdf-parse` / `mammoth`.
- Resumes are stored on local disk in `uploads/`. For deployment on hosts with ephemeral disks, switch to S3/Cloudinary.
