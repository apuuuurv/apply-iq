# ApplyIQ - AI Job Application Tracker & Resume Analyzer

ApplyIQ is a modern, premium AI-powered platform for tracking job applications and optimizing resumes.

## Features

- **Premium UI**: Fluid "Aurora" background and "Liquid Glass" components.
- **AI-Powered**: Summarize job descriptions and get resume improvement suggestions.
- **Smart Tracking**: Manage your applications with a clean, intuitive dashboard.
- **Auth Integrated**: Secure login with Supabase.
- **Responsive Animations**: Advanced Framer Motion effects for a seamless experience.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/apurv-ai-job-tracker.git
    cd ai-job-tracker
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Setup Environment Variables**:
    Create a `.env.local` file in the root directory (copy from `.env.example` if available) and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS v4, Framer Motion
- **Components**: Shadcn UI (Radix UI)
- **Backend**: Python (FastAPI/Uvicorn) - see `/backend` directory
- **Auth & Database**: Supabase

## Contributing

1. Create a feature branch.
2. Commit your changes.
3. Push to the branch and create a Pull Request.

---
Developed with ❤️ for job seekers everywhere.
