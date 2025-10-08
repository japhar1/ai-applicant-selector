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

🧰 Tech Stack
| Layer      | Technology                                |
| ---------- | ----------------------------------------- |
| Frontend   | React (Vite) + TailwindCSS + Lucide Icons |
| Backend    | FastAPI (Python) / Node.js                |
| Database   | SQLite / PostgreSQL (for persistence)     |
| Deployment | Vercel (frontend) + Railway (backend)     |
| AI Layer   | spaCy / OpenAI API / Custom Scoring       |


🧑‍💻 Setup Instructions

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


🔌 Integration Readiness

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

📊 Evaluation Alignment
| Criteria                  | Demonstration                                   |
| ------------------------- | ----------------------------------------------- |
| **Algorithm Accuracy**    | Weighted scoring logic + sample data validation |
| **UX/UI Design**          | Clean, responsive layout (HiringAgent-style)    |
| **Scalability**           | Modular architecture + reusable components      |
| **Integration Readiness** | REST endpoints ready for LMS integration        |


🧩 Future Improvements
- Full NLP model for semantic skill matching
- Multi-program applicant clustering
- Bias detection metrics
- LSETF LMS OAuth integration


🏁 Team & Credits
Developed by: [Your Team Name]
For: PLP Nigeria Hackathon (LSETF / Opolo)
Contact: team@yourapp.com
```yaml

---

## 🧠 2. Technical Architecture Diagram (text description)

You can create this in [draw.io](https://app.diagrams.net/) or [Excalidraw](https://excalidraw.com/) for your presentation.

```
┌──────────────────────────────────────────┐
│ User Interface │
│ (React + Tailwind, Deployed on Vercel) │
│ - Home Page (Overview) │
│ - Upload Page (File Input) │
│ - Dashboard (Ranked Results) │
└──────────────────────────────────────────┘
│
▼
┌──────────────────────────────────────────┐
│ Backend API Layer │
│ (FastAPI / Node.js on Railway) │
│ Endpoints: │
│ • /api/upload → parse resumes │
│ • /api/applicants → ranked list │
│ • /api/lsetf-export → JSON for LMS │
└──────────────────────────────────────────┘
│
▼
┌──────────────────────────────────────────┐
│ AI Engine │
│ - Resume Parser (spaCy / embeddings) │
│ - Scoring Function │
│ - Ranking Algorithm │
└──────────────────────────────────────────┘
│
▼
┌──────────────────────────────────────────┐
│ LSETF LMS Integration │
│ Future connection via REST/GraphQL │
│ Enables applicant data import/export │
└──────────────────────────────────────────┘

```yaml

---

## 🧾 3. Pitch Deck Outline (6–8 slides)

Use this structure for your Hackathon presentation (Google Slides, Canva, or PowerPoint).

| **Slide** | **Title** | **Content** |
|------------|------------|-------------|
| 1️⃣ | **Title Slide** | Project name, team, logos (PLP / LSETF / Opolo), tagline. |
| 2️⃣ | **Problem Statement** | Hiring for programs is slow, manual, and biased. Show 1–2 stats about recruitment inefficiency. |
| 3️⃣ | **Solution Overview** | Introduce your AI Applicant Selector — automated, scalable, fair. One screenshot of dashboard. |
| 4️⃣ | **How It Works** | 3-step process: Upload → Analyze → Rank. Include your architecture diagram. |
| 5️⃣ | **Demo / Prototype** | Screenshots or short clip of your working app (upload → ranked list). |
| 6️⃣ | **Impact & Scalability** | Faster selection, reduced bias, integration with LSETF LMS. Add metrics like “50% faster screening”. |
| 7️⃣ | **Tech Stack & AI Model** | Logos of React, FastAPI, Tailwind, Python; short text about weighted scoring logic. |
| 8️⃣ | **Next Steps & Ask** | Future improvements + readiness for pilot. End with your contact details. |

---

## ✅ Next Steps (your submission checklist)
- [x] Deploy updated frontend to Vercel  
- [x] Confirm backend endpoints on Railway  
- [x] Add this `README.md` and push  
- [x] Generate architecture diagram image  
- [x] Build 8-slide pitch deck (I can help you fill in visuals & content next)

---

Would you like me to **generate the actual pitch deck slides (with text and visuals layout suggestions)** next — so you can drop it straight into Canva or Google Slides?
```
