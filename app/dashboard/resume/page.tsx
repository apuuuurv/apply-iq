"use client"

import React from "react"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Target,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import {
  getResumes,
  createResume,
  deleteResume,
  analyzeResumeText,
  type Resume,
} from "@/lib/supabase/actions/resume"
import {
  syncResumeSkillsToProfile,
  calculateSkillGapFromResume,
} from "@/lib/supabase/actions/resume-skills-integration"
import { extractSkillsFromResumeText } from "@/lib/skills-extraction-utils"
import { createClient } from "@/lib/supabase/client"
import { analyzeResume, checkHealth } from "@/lib/api-client"

export default function ResumeAnalyzerPage() {
  const supabase = createClient()
  const [file, setFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [matchScore, setMatchScore] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(false)
  const [matchedSkills, setMatchedSkills] = useState<string[]>([])
  const [missingSkills, setMissingSkills] = useState<string[]>([])

  useEffect(() => {
    loadResumes()
  }, [])

  const loadResumes = async () => {
    try {
      setLoading(true)
      const data = await getResumes()
      console.log("Loaded resumes from Supabase:", data) // Debug log
      setResumes(data)
      
      // Auto-load the most recent analysis
      if (data && data.length > 0) {
        const mostRecent = data[0]
        console.log("Most recent resume:", mostRecent) // Debug log
        
        // Map database field names to component state
        const analysisResult = mostRecent.analysis_result || mostRecent.analysisResult
        
        if (analysisResult) {
          // Restore the analysis state
          setMatchScore(analysisResult.matchScore || 0)
          setMatchedSkills(analysisResult.matchedSkills || analysisResult.resume_skills || [])
          setMissingSkills(analysisResult.missingSkills || analysisResult.missing_skills || [])
          setJobDescription(analysisResult.jobDescription || "")
          setAnalysisComplete(true)
          console.log("Restored analysis:", analysisResult) // Debug log
        }
      }
    } catch (error) {
      console.error("Error loading resumes:", error)
      toast.error("Failed to load resumes")
    } finally {
      setLoading(false)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (
      droppedFile &&
      (droppedFile.type === "application/pdf" ||
        droppedFile.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    ) {
      setFile(droppedFile)
      setAnalysisComplete(false)
      toast.success("Resume uploaded successfully!")
    } else {
      toast.error("Please upload a PDF or DOCX file")
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setAnalysisComplete(false)
      toast.success("Resume uploaded successfully!")
    }
  }

  const handleAnalyze = async () => {
    if (!file || !jobDescription.trim()) {
      toast.error("Please upload a resume and enter a job description")
      return
    }

    setIsAnalyzing(true)
    setMatchScore(0)

    try {
      // Call the FastAPI backend to analyze resume
      const result = await analyzeResume(file, jobDescription)

      // Set matched and missing skills from backend response
      setMatchedSkills(result.resume_skills)
      setMissingSkills(result.missing_skills)

      // Animate match score from 0 to result
      for (let i = 0; i <= result.match_score; i += 2) {
        await new Promise((resolve) => setTimeout(resolve, 30))
        setMatchScore(i)
      }
      setMatchScore(result.match_score)

      // Optionally sync skills to profile
      try {
        const reader = new FileReader()
        reader.onload = async (e) => {
          const fileContent = e.target?.result as string
          try {
            // Skip skill sync for now - causing constraint violation
            // await syncResumeSkillsToProfile(fileContent)
            console.log("Resume skills sync disabled temporarily")
          } catch (syncError) {
            console.error("Error syncing skills:", syncError)
          }
        }
        reader.readAsText(file)
      } catch (syncError) {
        console.error("Error reading file for sync:", syncError)
      }

      // Save analysis to Supabase
      try {
        const resumeData = {
          fileName: file.name,
          extractedSkills: result.resume_skills,
          analysisResult: {
            jobDescription,
            matchScore: result.match_score,
            matchedSkills: result.resume_skills,
            missingSkills: result.missing_skills,
            strengths: [],
            areasToImprove: [],
            analysis: `Match Score: ${result.match_score}% - ${result.resume_skills.length} skills matched`,
          },
          matchScore: result.match_score,
        }
        console.log("Saving resume data to Supabase:", resumeData) // Debug log
        await createResume(resumeData)

        await loadResumes()
        toast.success("Resume analysis saved successfully!")
      } catch (dbError: any) {
        console.error("Error saving to database:", dbError)
        console.error("Full error details:", JSON.stringify(dbError, null, 2)) // Debug log
        // Don't fail - still show results even if save fails
        toast.warning("Analysis complete but couldn't save to database")
      }

      setIsAnalyzing(false)
      setAnalysisComplete(true)
    } catch (error: any) {
      console.error("Error analyzing resume:", error)
      const errorMessage =
        error.message || "Failed to analyze resume. Is the backend running?"
      toast.error(errorMessage)
      setIsAnalyzing(false)
    }
  }

  const extractSkillsFromText = (text: string): string[] => {
    // Use the client-side skill extraction utility
    const { all } = extractSkillsFromResumeText(text)
    return all
  }

  const removeFile = () => {
    setFile(null)
    setAnalysisComplete(false)
    setMatchScore(0)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Resume Analyzer
        </h1>
        <p className="mt-1 text-muted-foreground">
          Upload your resume and compare it against job descriptions
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Section */}
        <div className="space-y-6">
          {/* Resume Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Upload Resume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {!file ? (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <label
                      htmlFor="resume-upload"
                      className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                        isDragging
                          ? "border-accent bg-accent/5"
                          : "border-border hover:border-accent/50 hover:bg-muted/50"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
                      <p className="mb-1 text-sm font-medium">
                        Drag and drop your resume here
                      </p>
                      <p className="text-xs text-muted-foreground">
                        or click to browse (PDF, DOCX)
                      </p>
                      <input
                        id="resume-upload"
                        type="file"
                        accept=".pdf,.docx"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </label>
                  </motion.div>
                ) : (
                  <motion.div
                    key="file"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                        <FileText className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={removeFile}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Job Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Job Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste the job description here to compare against your resume..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Analyze Button */}
          <Button
            onClick={handleAnalyze}
            disabled={!file || !jobDescription.trim() || isAnalyzing}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing Resume...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Analyze Resume
              </>
            )}
          </Button>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Match Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Match Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center py-6">
                <div className="relative h-40 w-40">
                  <svg
                    className="h-full w-full -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      className="stroke-muted"
                      strokeWidth="8"
                      fill="none"
                      r="42"
                      cx="50"
                      cy="50"
                    />
                    <motion.circle
                      className="stroke-accent"
                      strokeWidth="8"
                      fill="none"
                      r="42"
                      cx="50"
                      cy="50"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: "0 264" }}
                      animate={{
                        strokeDasharray: `${matchScore * 2.64} 264`,
                      }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                      className="text-4xl font-bold"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {matchScore}%
                    </motion.span>
                    <span className="text-sm text-muted-foreground">Match</span>
                  </div>
                </div>
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  {analysisComplete
                    ? "Your resume is a good match for this position!"
                    : "Upload your resume and job description to see your match score"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Skills Analysis */}
          <AnimatePresence>
            {analysisComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="space-y-6"
              >
                {/* Matched Skills */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-success">
                      <CheckCircle2 className="h-5 w-5" />
                      Matched Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {matchedSkills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="bg-success/10 text-success"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Missing Skills */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-warning">
                      <AlertCircle className="h-5 w-5" />
                      Missing Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {missingSkills.map((skill) => (
                        <div key={skill}>
                          <div className="mb-1 flex justify-between text-sm">
                            <span>{skill}</span>
                          </div>
                          <Progress value={60} className="h-2" />
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      Consider adding these skills to strengthen your
                      application.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Placeholder when no analysis */}
          {!analysisComplete && !isAnalyzing && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="mb-4 h-12 w-12 text-muted-foreground/30" />
                <h3 className="text-lg font-semibold">No Analysis Yet</h3>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Upload your resume and paste a job description to get AI-powered
                  insights
                </p>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isAnalyzing && (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="relative">
                    <div className="h-16 w-16 animate-pulse rounded-full bg-accent/20" />
                    <Sparkles className="absolute inset-0 m-auto h-8 w-8 animate-pulse text-accent" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">
                    Analyzing Your Resume
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    AI is comparing your skills and experience...
                  </p>
                  <div className="mt-4 w-full max-w-xs">
                    <Progress value={matchScore} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Previous Analyses */}
      {resumes && resumes.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-bold tracking-tight">
            Previous Analyses
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {resumes.map((resume) => {
              const analysisResult = resume.analysis_result || resume.analysisResult
              return (
              <Card
                key={resume.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  if (analysisResult) {
                    setMatchScore(analysisResult.matchScore || 0)
                    setMatchedSkills(
                      analysisResult.matchedSkills || analysisResult.resume_skills || []
                    )
                    setMissingSkills(analysisResult.missingSkills || analysisResult.missing_skills || [])
                    setJobDescription(
                      analysisResult.jobDescription || ""
                    )
                    setAnalysisComplete(true)
                    // Scroll to top
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                }}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{resume.file_name || resume.fileName}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {new Date(resume.created_at || "").toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium">Match Score</span>
                      <span className="font-bold text-accent">
                        {analysisResult?.matchScore || 0}%
                      </span>
                    </div>
                    <Progress
                      value={analysisResult?.matchScore || 0}
                      className="h-2"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>
                      Skills Matched:{" "}
                      {(analysisResult?.matchedSkills || analysisResult?.resume_skills || []).length}
                    </p>
                    <p>
                      Missing:{" "}
                      {(analysisResult?.missingSkills || analysisResult?.missing_skills || []).length}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteResume(resume.id)
                      loadResumes()
                      toast.success("Analysis deleted")
                    }}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
