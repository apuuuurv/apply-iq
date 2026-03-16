"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Target,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  BookOpen,
  ExternalLink,
  ChevronRight,
  Zap,
  FileText,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  getSkillsByCategory,
  createSkill,
  deleteSkill,
} from "@/lib/supabase/actions/skills"
import {
  analyzeSkillGap,
  getLatestSkillAnalysis,
  deleteSkillAnalysis,
} from "@/lib/supabase/actions/skill-gap"
import { getUserResumeSkills } from "@/lib/supabase/actions/resume-skills-integration"

// Color mappings for priority badges
const priorityColors: Record<string, string> = {
  High: "bg-destructive/20 text-destructive",
  Medium: "bg-warning/20 text-warning",
  Low: "bg-muted text-muted-foreground",
}

export default function SkillGapPage() {
  const [selectedTab, setSelectedTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false)
  
  // Skill data
  const [matchedSkills, setMatchedSkills] = useState<any[]>([])
  const [missingSkills, setMissingSkills] = useState<any[]>([])
  const [suggestedSkills, setSuggestedSkills] = useState<any[]>([])
  
  // Resume skills
  const [resumeSkills, setResumeSkills] = useState<any>({
    matched: [],
    missing: [],
    suggested: [],
  })
  
  // Analysis form
  const [jobDescription, setJobDescription] = useState("")
  const [skillName, setSkillName] = useState("")
  const [skillLevel, setSkillLevel] = useState(80)
  
  // Analysis data
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [overallScore, setOverallScore] = useState(0)

  useEffect(() => {
    loadSkillsData()
  }, [])

  const loadSkillsData = async () => {
    try {
      setLoading(true)
      
      // Load matched skills
      const matched = await getSkillsByCategory('matched')
      setMatchedSkills(matched || [])
      
      // Load missing skills
      const missing = await getSkillsByCategory('missing')
      setMissingSkills(missing || [])
      
      // Load suggested skills
      const suggested = await getSkillsByCategory('suggested')
      setSuggestedSkills(suggested || [])
      
      // Load resume skills
      const resumeSkillsData = await getUserResumeSkills()
      setResumeSkills(resumeSkillsData)
      
      // Load latest analysis
      const latest = await getLatestSkillAnalysis()
      if (latest) {
        setAnalysisData(latest.analysis_result)
        setOverallScore(latest.overall_score || 0)
      }
    } catch (error) {
      console.error('Error loading skills:', error)
      toast.error('Failed to load skill data')
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyzeSkills = async () => {
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description')
      return
    }

    setIsAnalyzing(true)
    try {
      const result = await analyzeSkillGap(jobDescription)
      
      setAnalysisData(result)
      setOverallScore(result.overallScore)
      
      // Update skills from analysis
      setMatchedSkills(result.matchedSkills.map((s: string) => ({ name: s, level: 90 })))
      setMissingSkills(result.missingSkills.map((s: string) => ({ name: s, level: 0 })))
      setSuggestedSkills(result.suggestedSkills.map((s: string) => ({ name: s, level: 0 })))
      
      toast.success('Skill gap analysis completed!')
      setJobDescription('')
    } catch (error) {
      console.error('Error analyzing skills:', error)
      toast.error('Failed to analyze skills')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAddSkill = async () => {
    if (!skillName.trim()) {
      toast.error('Please enter a skill name')
      return
    }

    try {
      await createSkill({
        name: skillName,
        level: skillLevel,
        category: 'matched',
      })
      
      await loadSkillsData()
      setSkillName('')
      setSkillLevel(80)
      setIsAddSkillOpen(false)
      toast.success('Skill added successfully!')
    } catch (error) {
      console.error('Error adding skill:', error)
      toast.error('Failed to add skill')
    }
  }

  const handleDeleteSkill = async (id: string) => {
    try {
      await deleteSkill(id)
      await loadSkillsData()
      toast.success('Skill deleted successfully!')
    } catch (error) {
      console.error('Error deleting skill:', error)
      toast.error('Failed to delete skill')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Skill Gap Analysis
        </h1>
        <p className="mt-1 text-muted-foreground">
          Understand your strengths and areas for improvement
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{matchedSkills.length}</p>
                <p className="text-sm text-muted-foreground">Matched Skills</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{missingSkills.length}</p>
                <p className="text-sm text-muted-foreground">Skill Gaps</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallScore}%</p>
                <p className="text-sm text-muted-foreground">Overall Match</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Job Description Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              Analyze Job Description
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="job-desc">Paste Job Description</Label>
              <Textarea
                id="job-desc"
                placeholder="Paste the job description here to analyze required skills..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="mt-2 min-h-[120px]"
              />
            </div>
            <Button 
              onClick={handleAnalyzeSkills} 
              disabled={isAnalyzing || !jobDescription.trim()}
              className="w-full"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Skills'}
            </Button>
            <p className="text-xs text-muted-foreground">
              This will identify required skills in the job description and compare with your current skills.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Skill Dialog */}
      <Dialog open={isAddSkillOpen} onOpenChange={setIsAddSkillOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Skill</DialogTitle>
            <DialogDescription>
              Add a skill to your profile
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="skill-name">Skill Name</Label>
              <Input
                id="skill-name"
                placeholder="e.g., React, Python, etc."
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="skill-level">Proficiency Level: {skillLevel}%</Label>
              <input
                id="skill-level"
                type="range"
                min="0"
                max="100"
                value={skillLevel}
                onChange={(e) => setSkillLevel(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSkillOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSkill}>Add Skill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none lg:gap-2">
          <TabsTrigger value="overview" className="lg:px-6">
            Overview
          </TabsTrigger>
          <TabsTrigger value="skills" className="lg:px-6">
            Skills
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="lg:px-6">
            Suggestions
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Resume Insights */}
          {resumeSkills.matched && resumeSkills.matched.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                    <FileText className="h-5 w-5" />
                    Resume-Based Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Skills from Resume
                      </p>
                      <p className="mt-1 text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {resumeSkills.matched.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Skills to Learn
                      </p>
                      <p className="mt-1 text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {resumeSkills.missing.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Suggested Skills
                      </p>
                      <p className="mt-1 text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {resumeSkills.suggested.length}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    💡 Upload a resume on the Resume Analyzer page to automatically populate your skills profile
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Matched Skills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    Your Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {matchedSkills.length > 0 ? (
                    matchedSkills.map((skill) => (
                      <div key={skill.id || skill.name}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="font-medium">{skill.name}</span>
                          <span className="text-muted-foreground">
                            {skill.level}%
                          </span>
                        </div>
                        <Progress value={skill.level} className="h-2" />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No matched skills yet. Add skills or analyze a job description.
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Missing Skills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    Areas to Improve
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {missingSkills.length > 0 ? (
                    missingSkills.map((skill) => (
                      <div key={skill.id || skill.name}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="font-medium">{skill.name}</span>
                        </div>
                        <Progress value={skill.level || 0} className="h-2" />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No skill gaps identified yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Suggestions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-accent" />
                  Suggested Skills to Learn
                </CardTitle>
              </CardHeader>
              <CardContent>
                {suggestedSkills.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {suggestedSkills.slice(0, 2).map((skill, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 rounded-lg border border-border p-4"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{skill.name}</h4>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Add this skill to improve job match rate
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              setSkillName(skill.name)
                              setIsAddSkillOpen(true)
                            }}
                          >
                            Add to Skills
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Analyze a job description to see skill suggestions
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* All Matched Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  Matched Skills ({matchedSkills.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {matchedSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {matchedSkills.map((skill) => (
                      <Badge
                        key={skill.id || skill.name}
                        variant="secondary"
                        className="bg-success/10 px-3 py-1.5 text-success"
                      >
                        {skill.name} - {skill.level}%
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No matched skills yet. Add skills to get started.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Missing Skills with Resources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-accent" />
                  Quick Learning Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {missingSkills.length > 0 ? (
                  missingSkills.slice(0, 3).map((skill) => (
                    <div key={skill.id || skill.name} className="space-y-2 border-b pb-3 last:border-0">
                      <h4 className="font-medium">{skill.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Start learning this skill to improve your job match rate
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setSkillName(skill.name)
                          setIsAddSkillOpen(true)
                        }}
                      >
                        Add to My Skills
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No missing skills identified yet. Analyze a job description to see what to learn.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Suggested Skills to Learn
              </CardTitle>
            </CardHeader>
            <CardContent>
              {suggestedSkills.length > 0 ? (
                <div className="space-y-4">
                  {suggestedSkills.map((skill, index) => (
                    <motion.div
                      key={skill.id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="group flex items-start gap-4 rounded-lg border border-border p-4 transition-all hover:border-accent/50 hover:shadow-sm"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-semibold">{skill.name}</h4>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Add this skill to improve your job match rate
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() => {
                              setSkillName(skill.name)
                              setIsAddSkillOpen(true)
                            }}
                          >
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">
                    Analyze a job description to get skill suggestions
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
