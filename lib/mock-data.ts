export type ApplicationStatus = "applied" | "interview" | "offer" | "rejected"

export interface JobApplication {
  id: string
  company: string
  role: string
  appliedDate: string
  status: ApplicationStatus
  location: string
  salary?: string
  notes?: string
}

export interface Notification {
  id: string
  title: string
  description: string
  type: "interview" | "suggestion" | "reminder" | "update"
  isRead: boolean
  timestamp: string
}

export interface Skill {
  name: string
  level: number
  category: "matched" | "missing" | "suggested"
}

export const mockApplications: JobApplication[] = [
  {
    id: "1",
    company: "Google",
    role: "Senior Frontend Engineer",
    appliedDate: "2024-01-15",
    status: "interview",
    location: "Mountain View, CA",
    salary: "$180,000 - $250,000",
    notes: "Completed phone screen, technical interview scheduled",
  },
  {
    id: "2",
    company: "Stripe",
    role: "Full Stack Developer",
    appliedDate: "2024-01-12",
    status: "applied",
    location: "San Francisco, CA",
    salary: "$160,000 - $220,000",
  },
  {
    id: "3",
    company: "Vercel",
    role: "Software Engineer",
    appliedDate: "2024-01-10",
    status: "offer",
    location: "Remote",
    salary: "$150,000 - $200,000",
    notes: "Received offer, reviewing terms",
  },
  {
    id: "4",
    company: "Netflix",
    role: "UI Engineer",
    appliedDate: "2024-01-08",
    status: "rejected",
    location: "Los Angeles, CA",
    salary: "$170,000 - $230,000",
  },
  {
    id: "5",
    company: "Airbnb",
    role: "Frontend Developer",
    appliedDate: "2024-01-05",
    status: "interview",
    location: "San Francisco, CA",
    salary: "$155,000 - $210,000",
    notes: "Passed initial screen, awaiting next steps",
  },
  {
    id: "6",
    company: "Meta",
    role: "React Developer",
    appliedDate: "2024-01-03",
    status: "applied",
    location: "Menlo Park, CA",
    salary: "$175,000 - $240,000",
  },
  {
    id: "7",
    company: "Shopify",
    role: "Senior Developer",
    appliedDate: "2024-01-01",
    status: "interview",
    location: "Remote",
    salary: "$145,000 - $195,000",
  },
]

export const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Interview Scheduled",
    description: "Your interview with Google is scheduled for January 20th at 2:00 PM PST",
    type: "interview",
    isRead: false,
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    title: "Resume Improvement Suggestion",
    description: "Add more quantifiable achievements to strengthen your application",
    type: "suggestion",
    isRead: false,
    timestamp: "5 hours ago",
  },
  {
    id: "3",
    title: "Follow-up Reminder",
    description: "It's been 5 days since your application to Stripe. Consider sending a follow-up.",
    type: "reminder",
    isRead: true,
    timestamp: "1 day ago",
  },
  {
    id: "4",
    title: "Application Status Update",
    description: "Vercel has moved your application to the final review stage",
    type: "update",
    isRead: true,
    timestamp: "2 days ago",
  },
  {
    id: "5",
    title: "New Skill Recommendation",
    description: "Based on your target roles, consider learning TypeScript advanced patterns",
    type: "suggestion",
    isRead: true,
    timestamp: "3 days ago",
  },
]

export const mockMatchedSkills: Skill[] = [
  { name: "React", level: 90, category: "matched" },
  { name: "TypeScript", level: 85, category: "matched" },
  { name: "Next.js", level: 80, category: "matched" },
  { name: "JavaScript", level: 95, category: "matched" },
  { name: "CSS/Tailwind", level: 88, category: "matched" },
  { name: "Git", level: 82, category: "matched" },
]

export const mockMissingSkills: Skill[] = [
  { name: "GraphQL", level: 40, category: "missing" },
  { name: "System Design", level: 35, category: "missing" },
  { name: "AWS/Cloud", level: 45, category: "missing" },
  { name: "Docker", level: 30, category: "missing" },
]

export const mockSuggestedSkills: Skill[] = [
  { name: "Learn React Server Components", level: 0, category: "suggested" },
  { name: "Practice System Design interviews", level: 0, category: "suggested" },
  { name: "Build projects with GraphQL", level: 0, category: "suggested" },
  { name: "Get AWS certification", level: 0, category: "suggested" },
]

export const dashboardStats = {
  totalApplications: 47,
  activeApplications: 12,
  interviewsScheduled: 5,
  offersReceived: 2,
  responseRate: 34,
  averageMatchScore: 78,
}
