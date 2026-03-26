"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Briefcase,
  TrendingUp,
  Calendar,
  Award,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { dashboardStats, mockApplications } from "@/lib/mock-data"
import { getResumes } from "@/lib/supabase/actions/resume"

const statusColors: Record<string, string> = {
  applied: "bg-muted text-muted-foreground",
  interview: "bg-accent/20 text-accent",
  offer: "bg-success/20 text-success",
  rejected: "bg-destructive/20 text-destructive",
}

export default function DashboardPage() {
  const supabase = createClient()
  const [applications, setApplications] = useState<any[]>([])
  const [stats, setStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [resumeMatchScore, setResumeMatchScore] = useState(0)
  const [responseRate, setResponseRate] = useState(0)

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const { data, error } = await supabase
          .from('job_applications')
          .select('*')
          .order('applied_date', { ascending: false })
          .limit(5)

        if (error) {
          console.error('Error fetching applications:', error)
          // Fall back to mock data
          setApplications(mockApplications.slice(0, 5))
        } else {
          setApplications(data || [])
        }

        // Calculate stats from applications
        const allAppsData = await supabase
          .from('job_applications')
          .select('*')

        if (!allAppsData.error && allAppsData.data) {
          const totalApps = allAppsData.data.length
          const activeApps = allAppsData.data.filter(
            app => app.status !== 'rejected'
          ).length
          const interviews = allAppsData.data.filter(
            app => app.status === 'interview'
          ).length
          const offers = allAppsData.data.filter(
            app => app.status === 'offer'
          ).length

          // Calculate response rate
          const responses = activeApps + interviews + offers
          const responseRateValue = totalApps > 0 ? Math.round((responses / totalApps) * 100) : 0
          setResponseRate(responseRateValue)

          setStats([
            {
              name: "Total Applications",
              value: totalApps,
              change: "+12%",
              changeType: "positive" as const,
              icon: Briefcase,
            },
            {
              name: "Active Applications",
              value: activeApps,
              change: "+4%",
              changeType: "positive" as const,
              icon: TrendingUp,
            },
            {
              name: "Interviews Scheduled",
              value: interviews,
              change: "+2",
              changeType: "positive" as const,
              icon: Calendar,
            },
            {
              name: "Offers Received",
              value: offers,
              change: "+1",
              changeType: "positive" as const,
              icon: Award,
            },
          ])
        }

        // Fetch resume match score from Supabase
        try {
          const resumes = await getResumes()
          if (resumes && resumes.length > 0) {
            // Calculate average match score from latest resume
            const latestResume = resumes[0]
            const matchScore = latestResume.analysis_result?.matchScore || 
                              latestResume.match_score || 0
            setResumeMatchScore(matchScore)
          } else {
            setResumeMatchScore(0)
          }
        } catch (resumeError) {
          console.error('Error fetching resume:', resumeError)
          setResumeMatchScore(0)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setApplications(mockApplications.slice(0, 5))
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [supabase])

  // Default stats if not loaded yet
  const defaultStats = [
    {
      name: "Total Applications",
      value: 0,
      change: "+12%",
      changeType: "positive" as const,
      icon: Briefcase,
    },
    {
      name: "Active Applications",
      value: 0,
      change: "+4%",
      changeType: "positive" as const,
      icon: TrendingUp,
    },
    {
      name: "Interviews Scheduled",
      value: 0,
      change: "+2",
      changeType: "positive" as const,
      icon: Calendar,
    },
    {
      name: "Offers Received",
      value: 0,
      change: "+1",
      changeType: "positive" as const,
      icon: Award,
    },
  ]

  const displayStats = stats.length > 0 ? stats : defaultStats
  const recentApplications = applications.length > 0 ? applications : mockApplications.slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-zinc-950 dark:text-zinc-100">
          Dashboard
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-muted-foreground">
          Welcome back! Here&apos;s an overview of your job search.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {displayStats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="bg-white/80 dark:bg-card backdrop-blur-md border-zinc-200 dark:border-border shadow-sm shadow-blue-500/5 dark:shadow-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <stat.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-sm ${
                      stat.changeType === "positive"
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    {stat.changeType === "positive" ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-100">{stat.value}</p>
                  <p className="text-sm text-zinc-600 dark:text-muted-foreground">{stat.name}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Applications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="bg-white/80 dark:bg-card backdrop-blur-md border-zinc-200 dark:border-border shadow-sm shadow-blue-500/5 dark:shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Applications</CardTitle>
              <Link href="/dashboard/applications">
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentApplications.map((application) => (
                  <div
                    key={application.id}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-semibold">
                        {application.company.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-950 dark:text-zinc-100">
                          {application.company}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-muted-foreground">
                          {application.role}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={statusColors[application.status]}
                    >
                      {application.status.charAt(0).toUpperCase() +
                        application.status.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Resume Match Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card className="bg-white/80 dark:bg-card backdrop-blur-md border-zinc-200 dark:border-border shadow-sm shadow-blue-500/5 dark:shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Resume Match Score</CardTitle>
              <Link href="/dashboard/resume">
                <Button variant="ghost" size="sm">
                  Analyze
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="relative mx-auto h-32 w-32">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      className="stroke-zinc-200 dark:stroke-muted"
                      strokeWidth="10"
                      fill="none"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="stroke-cyan-500 dark:stroke-accent transition-all duration-1000"
                      strokeWidth="10"
                      fill="none"
                      r="40"
                      cx="50"
                      cy="50"
                      strokeLinecap="round"
                      strokeDasharray={`${resumeMatchScore * 2.51} 251`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-zinc-950 dark:text-zinc-100">
                      {resumeMatchScore}%
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-muted-foreground">
                  {resumeMatchScore > 0 
                    ? "Match score from latest resume analysis"
                    : "Upload a resume to see match score"}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-sm text-zinc-950 dark:text-zinc-100">
                    <span>Response Rate</span>
                    <span className="font-medium">
                      {responseRate}%
                    </span>
                  </div>
                  <Progress value={responseRate} className="h-2" />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>Interview Rate</span>
                    <span className="font-medium">24%</span>
                  </div>
                  <Progress value={24} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <Card className="bg-white/80 dark:bg-card backdrop-blur-md border-zinc-200 dark:border-border shadow-sm shadow-blue-500/5 dark:shadow-none">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/dashboard/applications">
                <Button variant="outline" className="h-auto w-full flex-col gap-2 p-4 bg-transparent">
                  <Briefcase className="h-6 w-6" />
                  <span>Add Application</span>
                </Button>
              </Link>
              <Link href="/dashboard/resume">
                <Button variant="outline" className="h-auto w-full flex-col gap-2 p-4 bg-transparent">
                  <TrendingUp className="h-6 w-6" />
                  <span>Analyze Resume</span>
                </Button>
              </Link>
              <Link href="/dashboard/skills">
                <Button variant="outline" className="h-auto w-full flex-col gap-2 p-4 bg-transparent">
                  <Award className="h-6 w-6" />
                  <span>View Skill Gaps</span>
                </Button>
              </Link>
              <Link href="/dashboard/notifications">
                <Button variant="outline" className="h-auto w-full flex-col gap-2 p-4 bg-transparent">
                  <Calendar className="h-6 w-6" />
                  <span>Check Reminders</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
