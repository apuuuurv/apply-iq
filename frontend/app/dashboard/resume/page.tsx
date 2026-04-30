"use client"

import React from "react"
import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useSkillGap } from "@/lib/context/skill-gap-context"
import {
  getNotifications,
  createNotification,
  type Notification,
} from "@/lib/supabase/actions/notifications"
import {
  getResumes,
  createResume,
  deleteResume,
  type Resume,
} from "@/lib/supabase/actions/resume"
import { createClient } from "@/lib/supabase/client"
import { analyzeResume } from "@/lib/api-client"
import { syncResumeSkillsToProfile } from "@/lib/supabase/actions/resume-skills-integration"
import { recordSkillGapAnalysis } from "@/lib/supabase/actions/skill-gap"

export default function ResumeAnalyzerPage() {
  const supabase = createClient()
  const { 
    missingSkills: globalMissingSkills, 
    setMissingSkills: setGlobalMissingSkills, 
    matchedSkills: globalMatchedSkills, 
    setMatchedSkills: setGlobalMatchedSkills, 
    matchScore: globalMatchScore, 
    setMatchScore: setGlobalMatchScore, 
    lastAnalysisDate, 
    setLastAnalysisDate 
  } = useSkillGap()
  
  const [file, setFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(!!globalMatchScore)
  const [matchScore, setMatchScore] = useState(globalMatchScore || 0)
  const [isDragging, setIsDragging] = useState(false)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(false)
  const [matchedSkills, setMatchedSkills] = useState<string[]>(globalMatchedSkills || [])
  const [techMatches, setTechMatches] = useState<string[]>(globalMatchedSkills || [])
  const [secondaryMatches, setSecondaryMatches] = useState<string[]>([])
  const [missingSkills, setMissingSkills] = useState<{skill: string, weight: number, is_critical: boolean}[]>(globalMissingSkills || [])
  const [gapSummary, setGapSummary] = useState("")
  const [selectedSkillProgress, setSelectedSkillProgress] = useState<{skill: string, bullet: string} | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    loadResumes()
  }, [])

  // Load persistent Job Description
  useEffect(() => {
    const fetchUserAndLoadJD = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const savedJD = localStorage.getItem(`applyiq_${user.id}_current_jd`)
        if (savedJD) {
          setJobDescription(savedJD)
        }
      }
    }
    fetchUserAndLoadJD()
  }, [])

  // Persist Job Description on change
  useEffect(() => {
    const saveJD = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        localStorage.setItem(`applyiq_${user.id}_current_jd`, jobDescription)
      }
    }
    saveJD()
  }, [jobDescription])

  const loadResumes = async () => {
    try {
      setLoading(true)
      const data = await getResumes()
      setResumes(data)
      
      // Auto-load if no current analysis but we have persistent data
      if (!analysisComplete && globalMatchScore) {
          setAnalysisComplete(true)
          setMatchScore(globalMatchScore)
          setMatchedSkills(globalMatchedSkills)
          setTechMatches(globalMatchedSkills)
          setMissingSkills(globalMissingSkills as any)
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
    if (droppedFile) {
      const fileExt = droppedFile.name.toLowerCase().split(".").pop()
      const allowedExts = ["pdf", "docx", "doc"]
      
      if (allowedExts.includes(fileExt || "")) {
        setFile(droppedFile)
        toast.success("Resume uploaded!")
      } else {
        toast.error("Unsupported file format. Please use PDF, DOCX, or DOC.")
      }
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const fileExt = selectedFile.name.toLowerCase().split(".").pop()
      const allowedExts = ["pdf", "docx", "doc"]
      
      if (allowedExts.includes(fileExt || "")) {
        setFile(selectedFile)
        toast.success("Resume uploaded!")
      } else {
        toast.error("Unsupported file format. Please use PDF, DOCX, or DOC.")
        // Reset the input so the same file can be selected again if fixed
        e.target.value = ""
      }
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
      // 1. AI Analysis
      const result = await analyzeResume(file, jobDescription)
      
      if (result.error) {
        toast.error(result.error, { duration: 6000 })
        setIsAnalyzing(false)
        return
      }

      // 2. Update UI with results
      setMatchedSkills(result.matched_skills)
      setTechMatches(result.tech_stack_matches)
      setSecondaryMatches(result.secondary_matches)
      setMissingSkills(result.missing_skills)
      setGapSummary(result.skill_gap_summary)

      // Animate match score
      for (let i = 0; i <= result.match_score; i += 2) {
        await new Promise((resolve) => setTimeout(resolve, 15))
        setMatchScore(i)
      }
      setMatchScore(result.match_score)

      // 3. Sync with global state
      setGlobalMissingSkills(result.missing_skills)
      setGlobalMatchedSkills(result.matched_skills)
      setGlobalMatchScore(result.match_score)
      setLastAnalysisDate(new Date().toISOString())
      setAnalysisComplete(true)

      // 4. Persistence & Notifications (Non-blocking)
      try {
        await createResume({
          fileName: file.name,
          extractedSkills: result.matched_skills,
          analysisResult: {
            jobDescription,
            matchScore: result.match_score,
            matchedSkills: result.matched_skills,
            missing_skills: result.missing_skills,
            gapSummary: result.skill_gap_summary,
          },
          matchScore: result.match_score,
        })
        
        // SYNC: Update user's profile skills with matched skills
        try {
          const resumeText = "Extracted from analysis"; // Placeholder or pass actual text if available
          await syncResumeSkillsToProfile(resumeText);
        } catch (syncError) {
          console.error("Skill sync error:", syncError);
        }

        // SYNC: Update Skill Gap Analysis dashboard
        try {
          await recordSkillGapAnalysis({
            jobDescription,
            matchedSkills: result.matched_skills,
            missingSkills: result.missing_skills,
            overallScore: result.match_score,
            analysisResult: {
              gapSummary: result.skill_gap_summary,
              techMatches: result.tech_stack_matches,
              secondaryMatches: result.secondary_matches
            }
          });
        } catch (gapError) {
          console.error("Gap recording error:", gapError);
        }

        loadResumes()
        
        await createNotification({
          title: "Resume Analyzed",
          description: `Analysis complete for ${file.name}. Match score: ${result.match_score}%`,
          type: "update",
        })
      } catch (persistenceError) {
        console.error("Persistence/Notification error:", persistenceError)
      }

      toast.success("Analysis complete!")

    } catch (error: any) {
      console.error("Critical Analysis Error:", error)
      toast.error(error.message || "The system failed to initialize the analysis pipeline.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const removeFile = () => {
    setFile(null)
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter sm:text-4xl text-zinc-950 dark:text-zinc-100 uppercase">
            Resume <span className="text-cyan-600 dark:text-[#22d3ee]">Analyzer</span>
          </h1>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.3em] text-zinc-600 dark:text-zinc-500">
            Precision Intelligence for Career Engineering
          </p>
        </div>
        <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${analysisComplete ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-zinc-300 dark:bg-zinc-800"}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                {analysisComplete ? "Live Analysis Ready" : "System Standby"}
            </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] xl:grid-cols-[1fr_400px] items-start">
        {/* Left Column - Results & JD */}
        <div className="space-y-6">
          {analysisComplete ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Score & AI Insight Row */}
              <div className="grid gap-6 md:grid-cols-[240px_1fr]">
                <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/40 backdrop-blur-xl rounded-2xl overflow-hidden border-t-zinc-200 dark:border-t-zinc-700/50 shadow-sm shadow-blue-500/5 dark:shadow-none">
                  <CardHeader className="pb-2 border-b border-zinc-200 dark:border-zinc-900">
                    <CardTitle className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-[#22d3ee]">
                      <TrendingUp className="h-4 w-4" />
                      Score Index
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center py-8">
                    <div className="relative h-44 w-44">
                      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                        <circle className="stroke-zinc-200 dark:stroke-zinc-900" strokeWidth="10" fill="none" r="40" cx="50" cy="50" />
                        <motion.circle
                          className="stroke-cyan-500 dark:stroke-[#22d3ee] drop-shadow-[0_0_8px_rgba(6,182,212,0.4)] dark:drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" strokeWidth="10" fill="none" r="40" cx="50" cy="50" strokeLinecap="round"
                          strokeDasharray="251.2"
                          initial={{ strokeDashoffset: 251.2 }}
                          animate={{ strokeDashoffset: 251.2 - (251.2 * matchScore) / 100 }}
                          transition={{ duration: 2, ease: "circOut" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-black tracking-tighter text-zinc-950 dark:text-zinc-100">{matchScore}%</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mt-1">Accuracy</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-zinc-200 dark:border-zinc-800 bg-cyan-50 dark:bg-[#22d3ee]/5 backdrop-blur-xl rounded-2xl border-t-cyan-200 dark:border-t-[#22d3ee]/20 flex flex-col justify-center shadow-sm shadow-blue-500/5 dark:shadow-none">
                  <CardContent className="pt-8">
                    <div className="flex gap-6">
                      <div className="h-14 w-14 rounded-2xl bg-cyan-100 dark:bg-[#22d3ee]/10 flex items-center justify-center shrink-0 border border-cyan-200 dark:border-[#22d3ee]/20 shadow-xl dark:shadow-2xl">
                        <Sparkles className="h-7 w-7 text-cyan-600 dark:text-[#22d3ee]" />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-700 dark:text-[#22d3ee] mb-3">AI Strategic Assessment</h4>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium line-clamp-4">
                          {gapSummary || "System has identified high-value technical intersections. Focusing on the missing architectural patterns will significantly enhance your candidacy for this specific hierarchy."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Matched Skills */}
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/40 backdrop-blur-xl rounded-2xl shadow-sm shadow-blue-500/5 dark:shadow-none">
                <CardHeader className="border-b border-zinc-200 dark:border-zinc-900 pb-4">
                  <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-green-500 text-[10px] font-black uppercase tracking-[0.2em]">
                    <CheckCircle2 className="h-4 w-4" />
                    Verified Expertise Found
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-wrap gap-2.5">
                    {techMatches.map((skill) => (
                      <Badge key={skill} variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-green-500/10 dark:text-green-400 border dark:border-green-500/20 rounded-lg px-4 py-2 font-black uppercase text-[10px] tracking-widest hover:bg-emerald-100 dark:hover:bg-green-500/20 transition-all cursor-default">
                        {skill}
                      </Badge>
                    ))}
                    {secondaryMatches.map((skill) => (
                      <Badge key={skill} variant="secondary" className="bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-400 border dark:border-zinc-700/50 rounded-lg px-4 py-2 font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all cursor-default">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card className="border-zinc-200 dark:border-zinc-800 border-dashed bg-white/50 dark:bg-black/20 rounded-3xl h-[360px] flex items-center justify-center text-center group transition-all hover:bg-zinc-100/50 dark:hover:bg-black/30 shadow-sm shadow-blue-500/5 dark:shadow-none">
              <CardContent>
                <div className="h-24 w-24 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mx-auto mb-8 border border-zinc-200 dark:border-zinc-800 group-hover:scale-110 transition-transform">
                  <FileText className="h-10 w-10 text-zinc-400 dark:text-zinc-700 group-hover:text-cyan-600 dark:group-hover:text-[#22d3ee] transition-colors" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-[0.2em] text-zinc-950 dark:text-zinc-100">Initializing...</h3>
                <p className="mt-4 max-w-[340px] text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 leading-relaxed mx-auto">
                    Awaiting data stream. Please upload your professional documentation and the target role parameters.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Job Description Box */}
          <Card className={cn(
            "relative border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/40 backdrop-blur-xl rounded-2xl border-t-zinc-200 dark:border-t-zinc-700/30 overflow-hidden shadow-sm transition-all duration-500",
            isFocused ? "shadow-[0_0_40px_rgba(34,211,238,0.1)] ring-1 ring-cyan-500/20 dark:ring-[#22d3ee]/20" : "shadow-blue-500/5 dark:shadow-none"
          )}>
            {/* Dynamic Corner Accents */}
            <div className={cn("absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/5 to-transparent transition-opacity", isFocused ? "opacity-100" : "opacity-0")} />
            <div className={cn("absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tl from-cyan-500/5 to-transparent transition-opacity", isFocused ? "opacity-100" : "opacity-0")} />
            
            <CardHeader className="pb-4 border-b border-zinc-200 dark:border-zinc-900 relative z-10">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-500">
                  <Target className={cn("h-4 w-4 transition-colors", isFocused ? "text-cyan-500 dark:text-[#22d3ee]" : "text-zinc-400")} />
                  Job Specification parameters
                </div>
                {jobDescription.length > 0 && (
                  <Badge variant="outline" className="text-[8px] font-black uppercase border-cyan-500/20 text-cyan-600 dark:text-[#22d3ee] px-2">
                    {jobDescription.split(/\s+/).filter(Boolean).length} Words
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 relative">
              <Textarea
                placeholder="PROMPT: Paste Role Requirements Here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                rows={12}
                className="resize-none border-none bg-transparent focus-visible:ring-0 rounded-none text-zinc-900 dark:text-zinc-100 font-medium p-8 text-sm leading-relaxed placeholder:text-zinc-400 dark:placeholder:text-zinc-500 selection:bg-cyan-500/10"
              />
              {/* Visual Feedback Line */}
              <div className={cn(
                "absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent transition-all duration-1000",
                isFocused ? "w-full opacity-100" : "w-0 opacity-0"
              )} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions & Gaps */}
        <div className="space-y-6 lg:sticky lg:top-8">
          {/* Main Action */}
          <Button
            onClick={handleAnalyze}
            disabled={!file || !jobDescription.trim() || isAnalyzing}
            className="w-full rounded-2xl py-12 text-xl font-black uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(34,211,238,0.2)] bg-cyan-500 dark:bg-[#22d3ee] text-white dark:text-zinc-950 hover:bg-cyan-600 dark:hover:bg-[#22d3ee]/90 transition-all active:scale-95 group relative overflow-hidden"
          >
            {isAnalyzing ? (
              <Loader2 className="h-10 w-10 animate-spin" />
            ) : (
              <span className="flex items-center gap-4 relative z-10">
                <Sparkles className="h-8 w-8 group-hover:rotate-12 transition-transform" />
                Analyze Pipeline
              </span>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </Button>

          {/* Upload card */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-black/60 backdrop-blur-2xl rounded-2xl border-t-zinc-200 dark:border-t-zinc-700/50 shadow-sm shadow-blue-500/5 dark:shadow-none">
            <CardHeader className="pb-4 border-b border-zinc-200 dark:border-zinc-900">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-[#22d3ee]">
                01. Logic Source (Resume)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {!file ? (
                <div
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all ${
                    isDragging ? "border-cyan-500 bg-cyan-50 dark:border-[#22d3ee] dark:bg-[#22d3ee]/10" : "border-zinc-300 hover:border-zinc-400 bg-zinc-50 dark:border-zinc-900 dark:hover:border-zinc-700 dark:bg-black/40"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="h-8 w-8 text-zinc-800 mb-4" />
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 text-center leading-loose">
                    Ingest PDF / DOCX Data
                  </p>
                  <input id="resume-upload" type="file" accept=".pdf,.docx" className="hidden" onChange={handleFileSelect} />
                  <label htmlFor="resume-upload" className="mt-8 cursor-pointer text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-[#22d3ee] hover:text-cyan-700 dark:hover:text-white transition-colors bg-cyan-50 dark:bg-[#22d3ee]/10 px-6 py-3 rounded-xl border border-cyan-200 dark:border-[#22d3ee]/20">Connect File</label>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-cyan-200 dark:border-[#22d3ee]/20 bg-cyan-50 dark:bg-[#22d3ee]/5 p-5">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="h-10 w-10 rounded-lg bg-cyan-100 dark:bg-[#22d3ee]/20 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-cyan-600 dark:text-[#22d3ee]" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 truncate">{file.name}</p>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase mt-0.5">Size: {(file.size / 1024).toFixed(1)}KB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={removeFile} className="h-10 w-10 rounded-full hover:bg-red-100 dark:hover:bg-destructive/20 text-zinc-500 hover:text-red-600 dark:hover:text-destructive shrink-0">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gaps Visualization */}
          {analysisComplete && (
            <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/40 backdrop-blur-xl rounded-2xl border-t-orange-200 dark:border-t-orange-500/20 shadow-sm shadow-blue-500/5 dark:shadow-none">
              <CardHeader className="border-b border-zinc-200 dark:border-zinc-900 pb-4">
                <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-500 font-black uppercase tracking-widest text-[10px]">
                  <AlertCircle className="h-4 w-4" />
                  Critical Skill Discrepancies
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 fancy-scrollbar">
                  {missingSkills.map((item) => (
                    <div key={item.skill} className="space-y-3 p-4 rounded-xl bg-zinc-50 dark:bg-black/60 border border-zinc-200 dark:border-zinc-900 group hover:border-zinc-300 dark:hover:border-zinc-800 transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-800 dark:text-zinc-200 truncate">{item.skill}</span>
                        <div className="flex shrink-0 gap-2">
                          <Button 
                            variant="ghost" size="sm" className="h-7 text-[8px] font-black uppercase tracking-widest px-3 text-zinc-500 dark:text-zinc-600 hover:text-cyan-600 dark:hover:text-[#22d3ee] border border-transparent hover:border-cyan-200 dark:hover:border-[#22d3ee]/20 transition-all"
                            onClick={() => {
                              const bullet = `• Engineered advanced workflows using ${item.skill} to optimize critical systems.`
                              navigator.clipboard.writeText(bullet); toast.success("DATA COPIED");
                            }}
                          >
                            Extract
                          </Button>
                          <a href={`https://www.google.com/search?q=${item.skill}`} target="_blank" className="h-7 flex items-center text-[8px] font-black uppercase tracking-widest px-3 text-zinc-500 dark:text-zinc-600 hover:text-orange-600 dark:hover:text-orange-500 border border-transparent hover:border-orange-200 dark:hover:border-orange-500/20 transition-all">
                            Study
                          </a>
                        </div>
                      </div>
                      <Progress value={item.weight} className={`h-1.5 bg-zinc-200 dark:bg-zinc-950 ${item.is_critical ? "[&>div]:bg-orange-500 dark:[&>div]:bg-orange-600 dark:shadow-[0_0_15px_rgba(234,88,12,0.4)]" : "[&>div]:bg-zinc-400 dark:[&>div]:bg-zinc-800"}`} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Previous Analyses - Bottom of page */}
      {resumes && resumes.length > 0 && (
        <div className="mt-12 pt-12 border-t border-zinc-200 dark:border-zinc-900">
          <h2 className="text-xl font-black uppercase tracking-[0.3em] text-zinc-500 mb-8">
            Analysis archives
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {resumes.map((resume) => {
              const resData = resume.analysis_result || resume.analysisResult
              return (
              <Card key={resume.id} className="bg-white/80 dark:bg-black/40 border-zinc-200 dark:border-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-800 transition-all group overflow-hidden shadow-sm shadow-blue-500/5 dark:shadow-none">
                <CardHeader className="pb-4 relative">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteResume(resume.id!).then(loadResumes); }} className="h-8 w-8 text-zinc-400 dark:text-zinc-800 hover:text-red-500 dark:hover:text-destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-950 dark:text-zinc-100 truncate pr-8">{resume.file_name || resume.fileName}</CardTitle>
                  <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-600 mt-1 uppercase">
                    {new Date(resume.created_at || "").toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-2 flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-zinc-500">Compatibility</span>
                      <span className="text-cyan-600 dark:text-[#22d3ee]">{resData?.matchScore || 0}%</span>
                    </div>
                    <Progress value={resData?.matchScore || 0} className="h-1 bg-zinc-200 dark:bg-zinc-950 [&>div]:bg-cyan-500 dark:[&>div]:bg-[#22d3ee]/40" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-[9px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-900/50"
                    onClick={() => {
                        window.scrollTo({ top: 0, behavior: "smooth" })
                        const matchScoreValue = resData?.matchScore || 0
                        const matchedSkillsValue = resData?.matchedSkills || []
                        const missingSkillsValue = resData?.missingSkills || []
                        
                        setMatchScore(matchScoreValue)
                        setTechMatches(matchedSkillsValue)
                        setMissingSkills(missingSkillsValue)
                        setGapSummary(resData?.gapSummary || "")
                        setAnalysisComplete(true)
                        
                        // Sync with global state for Resume Roaster
                        setGlobalMatchScore(matchScoreValue)
                        setGlobalMatchedSkills(matchedSkillsValue)
                        setGlobalMissingSkills(missingSkillsValue)
                        setLastAnalysisDate(resume.created_at || new Date().toISOString())
                    }}
                  >
                    View report
                  </Button>
                </CardContent>
              </Card>
            )})}
          </div>
        </div>
      )}
    </div>
  )
}
