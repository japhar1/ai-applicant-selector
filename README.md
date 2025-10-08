# 🤖 AI Applicant Selector

**An AI-powered platform for smart applicant screening and ranking.**  
Built for the **PLP x LSETF Hackathon – Nigeria Edition** under the theme:  
_“Building Tech-Driven Solutions for Nigeria’s Growth.”_

---

## 🚀 Overview

AI Applicant Selector helps organizations like **LSETF** and **PLP** automatically analyze and rank applicants for programs or jobs using AI.  
It processes resumes, cover letters, and assessments to generate **data-driven shortlists** and **insights dashboards** — helping teams make fairer, faster, and more objective selections.

🌍 **Live demo:** [https://ai-applicant-selector.vercel.app](https://ai-applicant-selector.vercel.app)  
🧠 **Hackathon Theme:** AI-Driven Applicant Selection Tool

---

## 🧩 Core Features
| Feature | Description |
|----------|--------------|
| **AI Resume Screening** | Extracts and scores candidate skills, experience, and education. |
| **Ranking Algorithm** | Produces a ranked shortlist using weighted criteria. |
| **Smart Uploads** | Accepts PDF, DOCX, or CSV data for bulk analysis. |
| **Insights Dashboard** | Displays top candidates, stats, and charts. |
| **Integration-Ready** | REST API endpoints ready for LSETF LMS linkage. |

---

## 🧠 AI Scoring Logic (Prototype)
Each applicant receives a composite score:

score = (skills_match * 0.4) + (experience * 0.3) + (education * 0.2) + (assessment * 0.1)

```yaml

The weights are configurable and can evolve into a full ML model later (e.g., fine-tuned embeddings for job-fit prediction).

---

## 🏗️ Architecture

```plaintext
Frontend (React + Tailwind)
│
├─ Pages: Home, Upload, Dashboard
│
├─ Components: Nav, Hero, FeatureCard, CandidateCard, Footer
│
└──> Connects via Axios to...
     ↓
Backend (FastAPI / Node.js)
├─ /api/upload        → Resume upload & parse
├─ /api/applicants    → Fetch ranked list
├─ /api/lsetf-export  → LMS integration endpoint
│
└──> AI Engine (Python/TF or rule-based model)
      - Resume parsing
      - Feature extraction
      - Weighted scoring
      - Ranking logic
```
> The architecture is modular — the scoring logic can easily evolve into a Machine Learning model integrated with FastAPI.

---
#🧰 Tech Stack
| Layer      | Technology                                |
| ---------- | ----------------------------------------- |
| Frontend   | React (Vite) + TailwindCSS + Lucide Icons |
| Backend    | FastAPI (Python) / Node.js                |
| Database   | SQLite / PostgreSQL (for persistence)     |
| Deployment | Vercel (frontend) + Railway (backend)     |
| AI Layer   | spaCy / OpenAI API / Custom Scoring       |

---

#🧑‍💻 Setup Instructions

1. Clone the repo:
```bash
git clone https://github.com/japhar1/ai-applicant-selector.git
cd ai-applicant-selector
```
2. Install dependencies:
```bash
npm install
```
3. Run locally:
```bash
npm run dev
```
4. (Optional) Run backend API (FastAPI or Node):
```bash
uvicorn main:app --reload
```

---

#🔌 Integration Readiness

The system outputs standardized JSON suitable for ingestion by LSETF’s LMS.

Example response:
```json
[
  {
    "id": 1,
    "name": "Ada Obi",
    "email": "ada@sample.com",
    "score": 88,
    "skills": ["Data Analysis", "Python", "Excel"]
  }
]
```
This format enables easy synchronization into user profiles or dashboards within the LMS ecosystem.

---

#📊 Evaluation Alignment

| Criteria                  | Demonstration                                   |
| ------------------------- | ----------------------------------------------- |
| **Algorithm Accuracy**    | Weighted scoring logic + sample data validation |
| **UX/UI Design**          | Clean, responsive layout (HiringAgent-style)    |
| **Scalability**           | Modular architecture + reusable components      |
| **Integration Readiness** | REST endpoints ready for LMS integration        |

---

#🧩 Future Improvements
- Full NLP model for semantic skill matching
- Multi-program applicant clustering
- Bias detection metrics
- LSETF LMS OAuth integration

---

#🏁 Team & Credits
- Developed by: [TeamOrochi]
- For: PLP Nigeria Hackathon (LSETF / Opolo)
- Contact: @japhar1

---
