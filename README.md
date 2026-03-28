# ApplyIQ - AI Job Application Tracker & Resume Analyzer

ApplyIQ is a premium, AI-powered platform designed to streamline your job search. It combines intelligent application tracking with deep resume analysis to help you land your dream job faster.

![ApplyIQ Logo](/public/icon.svg)

## 🚀 Key Features

- **Intelligent Resume Analysis**: Upload your resume and get a semantic match score against any job description.
- **Skill Gap Analysis**: Automatically identify missing skills and get suggestions on what to add to your resume.
- **Smart Application Tracking**: A modern, fluid dashboard to manage all your job applications in one place.
- **Premium UI/UX**: Built with "Aurora" backgrounds, "Liquid Glass" components, and smooth Framer Motion animations.
- **Secure Authentication**: Integrated with Supabase for robust user management.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Library**: React 19
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **UI Components**: Shadcn UI (Radix UI)

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **NLP**: spaCy (`en_core_web_sm`)
- **ML Models**: Sentence-Transformers (`all-MiniLM-L6-v2`)
- **Parsing**: pdfplumber, python-docx

### Database & Auth
- **Provider**: Supabase (PostgreSQL + GoTrue)

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- **Node.js**: v18 or higher
- **Python**: 3.10 or higher
- **Supabase Account**: A free project for Auth and Database

### 2. Frontend Setup (Next.js)

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Access at: `http://localhost:3000`

### 3. Backend Setup (FastAPI)

1. **Navigate to Backend**:
   ```bash
   cd backend
   ```

2. **Create Virtual Environment**:
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install Python Packages**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Download NLP Model**:
   ```bash
   python -m spacy download en_core_web_sm
   ```

5. **Run the API Server**:
   ```bash
   python main.py
   ```
   Access API Docs at: `http://localhost:8000/docs`

### 4. Database Setup (Supabase)

1. **Tables**: Ensure you have the following tables in your Supabase project:
   - `profiles`: Stores user information (id, full_name, etc.)
   - `job_applications`: Stores job tracking data (user_id, company, position, status, etc.)
   - `notifications`: Stores user alerts.
   
2. **Auth**: Enable Email/Password or Social logins in the Supabase Dashboard.

---

## 📂 Project Structure

```
ai-job-tracker/
├── app/                # Next.js App Router (Pages & Layouts)
├── components/         # Reusable UI Components
│   ├── dashboard/      # Dashboard-specific components
│   ├── landing/        # Landing page sections
│   └── ui/             # Base Shadcn components
├── public/             # Static assets (Icons, Logos)
├── lib/               # Utility functions & Supabase client
└── backend/           # Python FastAPI Source Code
    ├── models/        # Pydantic schemas
    ├── services/      # Business logic (Parsing, Matching)
    └── main.py        # API Entry point
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:
1. Fork the project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

Developed with ❤️ by Vaidik, Akshay, and Apurv.
