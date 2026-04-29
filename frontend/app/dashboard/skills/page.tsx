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
  Plus,
  Sparkles,
  Loader2,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts"
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
import { useSkillGap } from "@/lib/context/skill-gap-context"
import { percentToLevel, levelToPercent } from "@/lib/utils/skill-mapping"

// Color mappings for priority badges
const priorityColors: Record<string, string> = {
  High: "bg-destructive/20 text-destructive",
  Medium: "bg-warning/20 text-warning",
  Low: "bg-muted text-muted-foreground",
}

// Logical educational roadmap order
const ROADMAP_PRIORITY: Record<string, number> = {
  // Foundations
  "html": 1,
  "css": 2,
  "javascript": 3,
  "typescript": 4,
  "sql": 5,
  // Languages
  "python": 10,
  "java": 11,
  "c++": 12,
  "c#": 13,
  "ruby": 14,
  "php": 15,
  "go": 16,
  "rust": 17,
  // Frameworks/Libraries
  "react": 20,
  "node.js": 21,
  "express": 22,
  "next.js": 23,
  "spring": 24,
  "django": 25,
  "flask": 26,
  "angular": 27,
  "vue": 28,
  // Databases/Tools
  "mongodb": 30,
  "postgresql": 31,
  "mysql": 32,
  "redis": 33,
  "git": 40,
  "docker": 41,
  "kubernetes": 42,
  "aws": 43,
  "azure": 44,
  "google cloud": 45,
  "terraform": 46,
  // Soft Skills/Methodology
  "agile": 50,
  "scrum": 51,
  "system design": 60,
}

const getSkillPriority = (name: string): number => {
  const normalized = name.toLowerCase().trim()
  // Check for exact matches
  if (ROADMAP_PRIORITY[normalized]) return ROADMAP_PRIORITY[normalized]
  
  // Check for partial matches
  for (const [key, value] of Object.entries(ROADMAP_PRIORITY)) {
    if (normalized.includes(key)) return value
  }
  
  return 100 // Default for unknown skills
}

export default function SkillGapPage() {
  const { missingSkills: contextMissingSkills, matchedSkills: contextMatchedSkills, matchScore: contextMatchScore, lastAnalysisDate } = useSkillGap()
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
      
      // Load matched skills from context if possible or fallback to mock
      const matched = await getSkillsByCategory('matched')
      setMatchedSkills(matched || [])
      
      // Load missing skills from context primarily
      if (contextMissingSkills.length > 0) {
        const sortedMissing = [...contextMissingSkills]
          .sort((a, b) => getSkillPriority(a.skill) - getSkillPriority(b.skill))
          .map(s => ({ 
            name: s.skill, 
            level: 0, 
            weight: s.weight, 
            is_critical: s.is_critical 
          }))
        setMissingSkills(sortedMissing)
      } else {
        const missing = await getSkillsByCategory('missing')
        setMissingSkills((missing || []).sort((a: any, b: any) => getSkillPriority(a.name) - getSkillPriority(b.name)))
      }
      
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

  // Radar chart data
  const radarData = [
    ...(matchedSkills.slice(0, 5).map(s => ({ subject: s.name, target: 100, current: levelToPercent(s.level) || 80 }))),
    ...(missingSkills.slice(0, 3).map(s => ({ subject: s.name, target: 100, current: 20 })))
  ].slice(0, 8)

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
      setMatchedSkills(result.matchedSkills.map((s: string) => ({ name: s, level: 5 })))
      setMissingSkills(result.missingSkills
        .map((s: string) => ({ name: s, level: 0 }))
        .sort((a: any, b: any) => getSkillPriority(a.name) - getSkillPriority(b.name))
      )
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
        level: percentToLevel(skillLevel),
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
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl text-zinc-950 dark:text-white uppercase italic">
            Skill Gap Analysis
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-muted-foreground font-bold uppercase tracking-widest">
            Level up your career with AI-powered insights
          </p>
        </div>
        {lastAnalysisDate && (
          <Badge variant="outline" className="w-fit bg-[#22d3ee]/5 border-[#22d3ee]/20 text-[#22d3ee] gap-1.5 px-3 py-1 font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22d3ee] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22d3ee]"></span>
            </span>
            LAST ANALYSIS: {new Date(lastAnalysisDate).toLocaleDateString()}
          </Badge>
        )}
      </div>

      {/* Main Analysis Section */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] xl:grid-cols-[1fr_400px] items-start">
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { label: "Matched", value: matchedSkills.length, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
              { label: "Gaps", value: missingSkills.length, icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
              { label: "Match Rate", value: `${overallScore}%`, icon: TrendingUp, color: "text-[#22d3ee]", bg: "bg-[#22d3ee]/10" }
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-muted/5 backdrop-blur-sm overflow-hidden group shadow-sm shadow-blue-500/5 dark:shadow-none">
                  <CardContent className="p-6 flex items-center gap-4 relative">
                    <div className={cn("rounded-xl p-2 shrink-0 transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-zinc-950 dark:text-zinc-100">{stat.value}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Radar Chart Analysis */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-muted/5 backdrop-blur-lg overflow-hidden shadow-sm shadow-blue-500/5 dark:shadow-none">
            <CardHeader className="pb-2 border-b border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-950/20">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600 dark:text-[#22d3ee] flex items-center gap-2">
                <Target className="h-3 w-3" />
                Skill Comparison Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[350px] w-full">
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#27272a" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 10, fontWeight: 700 }} />
                      <Radar
                        name="Current"
                        dataKey="current"
                        stroke="#22d3ee"
                        fill="#22d3ee"
                        fillOpacity={0.4}
                        strokeWidth={2}
                      />
                      <Radar
                        name="Required"
                        dataKey="target"
                        stroke="#71717a"
                        fill="#71717a"
                        fillOpacity={0.1}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center px-12">
                    <Sparkles className="h-12 w-12 text-muted-foreground/20 mb-4" />
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      No matching data found. Analyze a resume to visualize your skill overlaps.
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-center gap-6 text-[10px] uppercase font-black tracking-widest">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#22d3ee] shadow-[0_0_8px_#22d3ee]" /> 
                  YOUR LEVEL
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-zinc-700" /> 
                  JOB REQUIREMENT
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manual Analysis Input */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-cyan-200 dark:border-[#22d3ee]/20 bg-cyan-50/50 dark:bg-[#22d3ee]/5 backdrop-blur-sm overflow-hidden shadow-sm shadow-blue-500/5 dark:shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black text-zinc-950 dark:text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-500 dark:text-[#22d3ee]" />
                  Ad-hoc Job Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <Textarea
                  placeholder="Paste a specific job description to find missing skills..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[140px] border-zinc-300 dark:border-zinc-800 bg-white/80 dark:bg-black/40 text-zinc-900 dark:text-zinc-100 focus-visible:ring-cyan-500 dark:focus-visible:ring-[#22d3ee] rounded-xl resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
                <Button 
                  onClick={handleAnalyzeSkills} 
                  disabled={isAnalyzing || !jobDescription.trim()}
                  className="w-full bg-cyan-500 dark:bg-[#22d3ee] text-white dark:text-zinc-950 font-black uppercase tracking-widest hover:bg-cyan-600 dark:hover:bg-[#22d3ee]/90 rounded-xl"
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {isAnalyzing ? 'Processing AI Data...' : 'Find Skill Gaps'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Roadmap Timeline */}
        <div className="space-y-6 lg:sticky lg:top-8">
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-muted/5 backdrop-blur-md h-full shadow-sm shadow-blue-500/5 dark:shadow-none">
            <CardHeader className="pb-4 border-b border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-950/20">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600 dark:text-[#22d3ee] flex items-center gap-2">
                <Zap className="h-3 w-3 fill-cyan-600 dark:fill-[#22d3ee]" />
                Your Learning Roadmap
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="max-h-[600px] overflow-y-auto pr-2 fancy-scrollbar">
              {missingSkills.length > 0 ? (
                <div className="relative space-y-10 before:absolute before:left-[17px] before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-gradient-to-b before:from-cyan-300 dark:before:from-[#22d3ee]/40 before:to-transparent">
                  {missingSkills.map((skill, idx) => (
                    <motion.div 
                      key={idx} 
                      className="relative pl-12 group"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div className="absolute left-0 top-1 h-9 w-9 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center z-10 shadow-sm dark:shadow-lg group-hover:border-cyan-500/50 dark:group-hover:border-[#22d3ee]/50 transition-colors">
                        <span className="text-[10px] font-black text-zinc-500 group-hover:text-cyan-600 dark:group-hover:text-[#22d3ee]">0{idx + 1}</span>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-black text-zinc-950 dark:text-zinc-100 capitalize tracking-tight">{skill.name}</h4>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <a 
                            href={`https://www.google.com/search?q=${encodeURIComponent(skill.name + ' documentation')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[8px] font-black px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-muted-foreground hover:text-zinc-900 dark:hover:text-white transition-all flex items-center gap-1.5 uppercase tracking-widest"
                          >
                            Documentation <ExternalLink className="h-2 w-2" />
                          </a>
                          <a 
                            href={`https://www.coursera.org/search?query=${encodeURIComponent(skill.name)}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-cyan-50 dark:bg-[#22d3ee]/10 hover:bg-cyan-100 dark:hover:bg-[#22d3ee]/20 text-cyan-600 dark:text-[#22d3ee] text-[8px] font-black px-2 py-1 rounded-md border border-cyan-200 dark:border-[#22d3ee]/20 transition-all flex items-center gap-1.5 uppercase tracking-widest"
                          >
                            Video Course <ExternalLink className="h-2 w-2" />
                          </a>
                        </div>
                        {skill.is_critical && (
                          <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            className="mt-3 p-3 rounded-lg bg-warning/5 border border-warning/10"
                          >
                            <p className="text-[10px] text-warning/80 font-bold uppercase tracking-widest flex items-center gap-2 mb-1">
                              <Lightbulb className="h-3 w-3" />
                              Recommendation
                            </p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                              Get certified: <span className="text-zinc-300">{skill.name === 'React' ? 'AWS Certified Cloud Practitioner' : `${skill.name} Specialist Certification`}</span>
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-32 text-center">
                  <div className="relative inline-block">
                    <Target className="mx-auto h-12 w-12 text-muted-foreground/10" />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                      className="absolute inset-0 bg-[#22d3ee] blur-2xl rounded-full"
                    />
                  </div>
                  <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-8">
                    Your roadmap will materialize here once a resume is analyzed.
                  </p>
                </div>
              )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detail Tabs Section */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mt-12">
        <TabsList className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 mb-8">
          {["overview", "skills", "suggestions"].map((tab) => (
            <TabsTrigger 
              key={tab}
              value={tab} 
              className="data-[state=active]:bg-cyan-500 dark:data-[state=active]:bg-[#22d3ee] data-[state=active]:text-white dark:data-[state=active]:text-zinc-950 font-black uppercase tracking-widest text-[10px] py-2 px-6"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Strongest Skills — reads from Global State matchedSkills */}
            <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-muted/5 backdrop-blur-sm shadow-sm shadow-blue-500/5 dark:shadow-none">
              <CardHeader>
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-green-500">Strongest Skills</CardTitle>
              </CardHeader>
              <CardContent>
                {contextMatchedSkills && contextMatchedSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {contextMatchedSkills.slice(0, 5).map((skill, idx) => {
                      // Gradient: first skills lean green, later lean cyan
                      const gradientClass = idx < 2
                        ? "bg-green-500/10 text-green-400 border-green-500/25"
                        : idx < 4
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                        : "bg-cyan-500/10 text-cyan-400 border-cyan-500/25"
                      return (
                        <span
                          key={skill}
                          className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider border ${gradientClass} transition-all hover:scale-105`}
                        >
                          {skill}
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                    <Info className="h-6 w-6 text-zinc-600" />
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest max-w-[180px] leading-relaxed">
                      Upload a resume in the Analyzer to see your top strengths.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Primary Gaps — id for scroll target from Roaster */}
            <Card id="primary-gaps" className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-muted/5 backdrop-blur-sm shadow-sm shadow-blue-500/5 dark:shadow-none">
              <CardHeader>
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600 dark:text-[#22d3ee]">Primary Gaps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {missingSkills.length > 0 ? (
                  missingSkills.slice(0, 5).map((skill) => (
                    <div key={skill.id || skill.name}>
                      <div className="mb-2 flex justify-between text-xs font-bold uppercase tracking-widest">
                        <span className="text-zinc-900 dark:text-zinc-300">{skill.name}</span>
                        <span className="text-zinc-500">{skill.weight}% Importance</span>
                      </div>
                      <Progress value={skill.weight || 20} className="h-1 bg-zinc-200 dark:bg-zinc-800" indicatorClassName="bg-cyan-500 dark:bg-[#22d3ee]" />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest text-center py-8">Zero gaps identified in recent searches.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="skills">
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-muted/5 shadow-sm shadow-blue-500/5 dark:shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600 dark:text-[#22d3ee]">Skill Repository</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-[9px] font-black uppercase tracking-widest border-[#22d3ee]/20 text-[#22d3ee] hover:bg-[#22d3ee]/10"
                onClick={() => setIsAddSkillOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Custom Skill
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {matchedSkills.map((skill) => (
                  <Badge
                    key={skill.id || skill.name}
                    variant="secondary"
                    className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-green-500/10 dark:text-green-500 border dark:border-green-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                  >
                    {skill.name} • {levelToPercent(skill.level)}%
                  </Badge>
                ))}
                {missingSkills.map((skill) => (
                  <Badge
                    key={skill.id || skill.name}
                    variant="secondary"
                    className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-500 border dark:border-orange-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                  >
                    {skill.name} (GAP)
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggestedSkills.map((skill, index) => (
              <motion.div
                key={skill.id || index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-muted/5 hover:border-cyan-300 dark:hover:border-[#22d3ee]/30 transition-all group overflow-hidden shadow-sm shadow-blue-500/5 dark:shadow-none">
                  <div className="h-1 w-0 bg-cyan-500 dark:bg-[#22d3ee] group-hover:w-full transition-all duration-500" />
                  <CardContent className="p-5">
                    <h4 className="font-black text-sm text-zinc-950 dark:text-zinc-100 uppercase tracking-tight">{skill.name}</h4>
                    <p className="text-[10px] text-zinc-500 dark:text-muted-foreground font-bold uppercase mt-1">Recommended addition</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-4 w-full text-[9px] font-black uppercase tracking-widest text-[#22d3ee] hover:bg-[#22d3ee]/10"
                      onClick={() => {
                        setSkillName(skill.name)
                        setIsAddSkillOpen(true)
                      }}
                    >
                      Add to Profile <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Skill Dialog */}
      <Dialog open={isAddSkillOpen} onOpenChange={setIsAddSkillOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-widest text-[#22d3ee]">Add New Attribute</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Skill Designation</Label>
              <Input
                placeholder="e.g., KUBERNETES, TERRAFORM..."
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                className="bg-black border-zinc-800 text-zinc-100 focus-visible:ring-[#22d3ee]"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Proficiency Depth</Label>
                <span className="text-xs font-black text-[#22d3ee]">{skillLevel}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={skillLevel}
                onChange={(e) => setSkillLevel(parseInt(e.target.value))}
                className="w-full accent-[#22d3ee] bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
          <DialogFooter className="mt-6 flex gap-2">
            <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest" onClick={() => setIsAddSkillOpen(false)}>
              Abort
            </Button>
            <Button className="bg-[#22d3ee] text-zinc-950 font-black uppercase tracking-widest px-8" onClick={handleAddSkill}>Deploy Skill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
