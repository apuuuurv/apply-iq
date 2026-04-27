"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Flame, Copy, ArrowRight, Check, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { useSkillGap } from "@/lib/context/skill-gap-context"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createNotification } from "@/lib/supabase/actions/notifications"

// -------------------------------------------------------------------
// DYNAMIC ROAST ENGINE (3 Paragraphs)
// -------------------------------------------------------------------

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function buildContext(score: number, missing: any[], matched: string[], role: string) {
  const roundedScore = Math.round(score)
  const criticalMissing = missing.filter((m) => m.is_critical).map((m) => m.skill)
  const allMissing = missing.map((m) => m.skill)
  const primaryMissing = criticalMissing.length > 0 ? criticalMissing : allMissing
  
  const skill1 = primaryMissing[0] || "basic comprehension"
  const skill2 = primaryMissing[1] || "industry standards"
  const skill3 = primaryMissing[2] || "common sense"
  const matchedStr = matched.length > 0 ? matched.slice(0, 2).join(" and ") : "literally nothing"
  const targetRole = role.trim() || "this role"
  
  return { roundedScore, skill1, skill2, skill3, matchedStr, targetRole }
}

// ------ BRUTAL RECRUITER DICTIONARY ------
const RECRUITER_HOOKS = [
  "I received your application for {role}. Then I stared at my screen in disbelief. A {score}% match? Really?",
  "Reviewing your application for {role} was physically painful. My ATS flagged your {score}% match in 0.3 seconds.",
  "Did you accidentally submit a blank application for {role}? Handing me a {score}% match is a profound waste of my time.",
  "Your application for {role} is a digital tragedy. A {score}% match rate is where I usually stop reading, but I'll make an exception to explain why.",
  "This is what happens when candidates mass-apply to {role} without reading the requirements. {score}% is an automatic rejection."
]

const RECRUITER_DIVES = [
  "Let's talk about why you failed. You flex {matched} like it's an achievement. It's not; it's the absolute baseline. Meanwhile, you are completely missing {skill1} and {skill2}. These aren't 'nice-to-haves', they are core requirements for {role}. It makes your resume look incredibly dated and exposes your lack of depth.",
  "Your technical profile is profoundly misaligned. You listed {matched}, which is table stakes for {role}. But frankly, omitting {skill1} and {skill2} from your resume tells me you've been living under a rock. These gaps don't just 'look bad'—they immediately disqualify you from any serious consideration.",
  "The formatting might be fine, but the substance is hollow. You claim you're ready for {role}, yet there is zero evidence of {skill1} or {skill2} anywhere on this document. I've had interns with stronger profiles. Handing over {matched} isn't going to cover up the fact that your stack is missing the very things that make modern engineering function.",
  "I'll be direct: your skill matrix is a liability. You might know {matched}, but lacking {skill1} and {skill2} means you wouldn't survive onboarding. The hiring manager specifically flagged these as non-negotiable for {role}. This isn't a junior position where we teach you the alphabet."
]

const RECRUITER_ADVICE = [
  "Not proceeding at this time. Please re-apply when you have relevant experience. Years of it.",
  "We'll keep you on file. (We won't. I'm actively deleting this).",
  "Strong pass. I recommend a complete overhaul before your next attempt.",
  "Do yourself a favor: read the job description next time. Closed.",
  "We've decided to move forward with candidates who actually meet the minimum bar. Best of luck elsewhere."
]

// ------ TECH BRO DICTIONARY ------
const TECHBRO_HOOKS = [
  "Bro... 404 Resume Not Found. You're applying for {role} with a {score}% match? Have you tried turning your career off and on again?",
  "My smart fridge has better uptime than your qualifications for {role}. {score}% match is basically a 500 Internal Server Error.",
  "Bruh, it's giving 'followed a todo-app tutorial'. Applying for {role} with a {score}% match? That's a merge conflict with reality.",
  "This isn't even a pull request for {role}, it's a drive-by comment. {score}% match means you're not even getting past the linter.",
  "Git reset --hard HEAD and start over. {score}% match for {role}? You're getting ratio'd by the HR bot."
]

const TECHBRO_DIVES = [
  "I see you flexing {matched}. Cool, so does every bootcamp grad from 2021. But where is {skill1} and {skill2}? Bro, those are literally our backend pillars. Applying for {role} without {skill1} is like ordering a pizza with no cheese. It's technically food, but it's still wrong. You're trying to build planes while you barely know how to fold paper.",
  "Ngl, this is mid. You listed {matched} which is literally the stack from my first hackathon in 2019. But missing {skill1} and {skill2}? We're not accepting legacy applicants for {role}. It's 2025. Please update your dependencies because trying to ship without {skill1} is going to break production on day one.",
  "Your architecture is fundamentally flawed. You've got {matched}, great. But lacking {skill1} and {skill2} tells me you've been stuck in tutorial hell. We need {skill1} to survive onboarding week one for {role}. This isn't gatekeeping, it's just our entire infrastructure. Skill issue tbh.",
  "This resume needs a massive refactor. You've ignored {skill1} and {skill2} in a system that bleeds {skill1}. That's not a skill gap, that's a skill chasm. You know {matched}, but that isn't going to save you when the servers go down. You're applying for {role} but coding like it's 2015."
]

const TECHBRO_ADVICE = [
  "npm uninstall self-doubt, install actual_skills. Closed, won't fix.",
  "Come back when you rewrite it all in Rust. Or just touch grass.",
  "Ship something real in production, then maybe talk to us. Until then, stay in staging.",
  "Your career is stuck in a while(true) loop of failure. Skill issue.",
  "Please update your dependencies and retry. Preferably at another company."
]

// ------ GORDON RAMSAY DICTIONARY ------
const RAMSAY_HOOKS = [
  "WHAT IS THIS?! You call this an application for {role}?! A {score}% match is RAW! Completely RAW! I've had better qualifications from a POTATO!",
  "WHERE IS THE RESUME?! You've sent me a BLANK PLATE for {role}! {score}%?! I wouldn't serve this to my WORST ENEMY!",
  "Look at this DISASTER! A {score}% match for {role}?! MY GRAN COULD CODE BETTER THAN THIS AND SHE'S BEEN DEAD FOR 20 YEARS!",
  "This application for {role} is a HEALTH HAZARD! {score}%?! You'd serve me an EMPTY BOWL and call it a career?!",
  "A bloody {score}% match?! Look at this mess! You apply for {role} looking like THIS?! Absolutely EMBARRASSING!"
]

const RAMSAY_DIVES = [
  "Look at the plate! You've overcooked {matched} and completely FORGOTTEN {skill1} and {skill2}?! This {skill1} is the BACKBONE of {role}! It's like serving me a risotto with NO PARMESAN! It's undercooked, unseasoned, and entirely flavourless!",
  "You call yourself a professional?! You've done the mise en place—{matched} is there—but you've left out {skill1} and {skill2}! The whole SERVICE is compromised! {skill1} is STONE COLD RAW! You're trying to get a job as {role} and you bring me this?! SHAMEFUL!",
  "I'm looking at this and I'm stunned. {matched} is fine, like a piece of dry chicken. But missing {skill1} and {skill2}?! How do you expect to survive {role}?! You've sent me a soufflé with NO EGGS! The entire dish collapses without {skill1}!",
  "This career is CREMATED! Overburnt on the outside with {matched}, completely RAW on the inside because {skill1} and {skill2} are MISSING FROM THE PLATE! You want to be {role}?! I've seen better-prepared carbonara from a MUSTAQUE MACAQUE in its FIRST WEEK!"
]

const RAMSAY_ADVICE = [
  "SHUT IT DOWN! SHUT THE WHOLE THING DOWN! GET OUT!",
  "Start again from SCRATCH! You're an INSTULT to the PROFESSION! DONKEY!",
  "REFIRE! Take off your apron and GO HOME!",
  "This isn't a resume, it's a GARBAGE BIN! OUT! OUT! OUT!",
  "DREADFUL completely DREADFUL! Back to the kitchen sink!"
]

function generateParagraphRoast(score: number, missing: any[], matched: string[], role: string, personality: 'recruiter' | 'techbro' | 'ramsay'): string {
  const ctx = buildContext(score, missing, matched, role)
  let hooks, dives, advices;

  if (personality === 'recruiter') { hooks = RECRUITER_HOOKS; dives = RECRUITER_DIVES; advices = RECRUITER_ADVICE; }
  else if (personality === 'techbro') { hooks = TECHBRO_HOOKS; dives = TECHBRO_DIVES; advices = TECHBRO_ADVICE; }
  else { hooks = RAMSAY_HOOKS; dives = RAMSAY_DIVES; advices = RAMSAY_ADVICE; }

  const populate = (text: string) => {
    return text
      .replace(/{score}/g, ctx.roundedScore.toString())
      .replace(/{role}/g, ctx.targetRole)
      .replace(/{matched}/g, ctx.matchedStr)
      .replace(/{skill1}/g, ctx.skill1)
      .replace(/{skill2}/g, ctx.skill2)
  }

  const p1 = populate(pickRandom(hooks))
  const p2 = populate(pickRandom(dives))
  const p3 = populate(pickRandom(advices))

  return `${p1}\n\n${p2}\n\n${p3}`
}

const PERSONALITIES = {
  recruiter: {
    id: "recruiter",
    name: "The Brutal Recruiter",
    generate: (s: number, m: any[], ma: string[], r: string) => generateParagraphRoast(s, m, ma, r, 'recruiter')
  },
  techbro: {
    id: "techbro",
    name: "The Tech Bro",
    generate: (s: number, m: any[], ma: string[], r: string) => generateParagraphRoast(s, m, ma, r, 'techbro')
  },
  ramsay: {
    id: "ramsay",
    name: "Gordon Ramsay Mode",
    generate: (s: number, m: any[], ma: string[], r: string) => generateParagraphRoast(s, m, ma, r, 'ramsay')
  },
}

// -------------------------------------------------------------------
// TYPEWRITER COMPONENT (Fast Speed for Long Text)
// -------------------------------------------------------------------
const Typewriter = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState("")
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setDisplayedText("")
    setIndex(0)
  }, [text])

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        // Fast typing for multi-paragraph to avoid user boredom
        setDisplayedText((prev) => prev + text.slice(index, index + 3))
        setIndex((prev) => prev + 3)
      }, 15)
      return () => clearTimeout(timeout)
    } else if (onComplete) {
      onComplete()
    }
  }, [index, text, onComplete])

  return <span>{displayedText}</span>
}

// -------------------------------------------------------------------
// MAIN PAGE
// -------------------------------------------------------------------
export default function ResumeRoasterPage() {
  const { matchScore, missingSkills, matchedSkills, lastAnalysisDate } = useSkillGap()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState("recruiter")
  const [roasts, setRoasts] = useState<Record<string, string>>({})
  const [isRoasting, setIsRoasting] = useState(false)
  const [hasRoast, setHasRoast] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // NEW: Target Role Input
  const [targetRole, setTargetRole] = useState("")

  const hasData = matchScore > 0 || missingSkills?.length > 0

  // Sanitised numeric values — prevents overflow from floating-point
  const safeScore = Math.round(Math.min(100, Math.max(0, matchScore || 0)))
  const burnLevel = Math.round(Math.min(100, Math.max(0, 100 - safeScore)))

  // SVG circle: r=40 → C = 2π×40 ≈ 251.33
  const CIRCUMFERENCE = 2 * Math.PI * 40
  const burnColor = burnLevel > 80 ? "#dc2626" : burnLevel > 50 ? "#ea580c" : "#eab308"

  // Check for stale data on mount or when context changes
  useEffect(() => {
    try {
      const savedDate = localStorage.getItem("applyiq_roast_date")
      const saved = localStorage.getItem("currentRoast")

      // If we have a new analysis that wasn't roasted yet, clear the old roasts
      if (lastAnalysisDate && savedDate !== lastAnalysisDate) {
        setRoasts({})
        setHasRoast(false)
        localStorage.removeItem("currentRoast")
        return
      }

      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed === "object" && Object.keys(parsed).length > 0) {
          setRoasts(parsed)
          setHasRoast(true)
        }
      }
    } catch (e) {
      console.error("Failed to load saved roasts", e)
    }
  }, [lastAnalysisDate])

  const handleStartRoasting = () => {
    if (!hasData) return
    setIsRoasting(true)
    setHasRoast(false)
    setRoasts({})

    setTimeout(async () => {
      const role = targetRole.trim() || "Software Engineer" // Fallback if empty
      const newRoasts = {
        recruiter: PERSONALITIES.recruiter.generate(safeScore, missingSkills || [], matchedSkills || [], role),
        techbro: PERSONALITIES.techbro.generate(safeScore, missingSkills || [], matchedSkills || [], role),
        ramsay: PERSONALITIES.ramsay.generate(safeScore, missingSkills || [], matchedSkills || [], role),
      }
      setRoasts(newRoasts)
      setHasRoast(true)
      setIsRoasting(false)
      
      // Persist to localStorage including the date to manage staleness
      localStorage.setItem("currentRoast", JSON.stringify(newRoasts))
      // Create notification
      try {
        await createNotification({
          title: "Resume Roasted",
          description: `Your resume was roasted for the ${role} role. Burn Level: ${burnLevel}%`,
          type: "suggestion",
        })
      } catch (notifError) {
        console.error("Error creating notification:", notifError)
      }

      if (lastAnalysisDate) {
        localStorage.setItem("applyiq_roast_date", lastAnalysisDate)
      }
    }, 1800)
  }

  const handleCopy = () => {
    const personality = PERSONALITIES[activeTab as keyof typeof PERSONALITIES]
    if (roasts[activeTab]) {
      const shareText = [
        `🔥 ApplyIQ Resume Roast — ${personality.name} for ${targetRole || "Software Engineer"}`,
        ``,
        `"${roasts[activeTab]}"`,
        ``,
        `Match Score: ${safeScore}% | Burn Level: ${burnLevel}%`,
        `#ApplyIQ #ResumeRoast`,
      ].join("\n")
      navigator.clipboard.writeText(shareText)
      setCopied(true)
      toast.success("Roast copied! Go share your trauma. 🔥")
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleCoolDown = () => {
    router.push("/dashboard/skills#primary-gaps")
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter sm:text-4xl text-zinc-950 dark:text-zinc-100 uppercase flex items-center gap-3">
            Resume{" "}
            <span className="text-orange-600 dark:text-orange-500 flex items-center gap-1">
              Roaster <Flame className="h-8 w-8" />
            </span>
          </h1>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.3em] text-zinc-600 dark:text-zinc-500">
            Let AI destroy your confidence so recruiters don't have to
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] xl:grid-cols-[1fr_400px] items-start">
        {/* LEFT — The Oven */}
        <div className="space-y-6">
          <Card
            className={`relative overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950 rounded-2xl transition-all duration-1000 shadow-sm shadow-orange-500/5 dark:shadow-none ${
              hasRoast ? "border-orange-300 dark:border-orange-600/30 shadow-[0_0_60px_rgba(234,88,12,0.05)] dark:shadow-[0_0_60px_rgba(234,88,12,0.12)]" : ""
            }`}
          >
            {/* Ambient glow effects */}
            {hasRoast && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-orange-600/15 blur-[80px] animate-pulse" />
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-red-700/10 blur-[80px] animate-[pulse_5s_ease-in-out_infinite]" />
              </div>
            )}

            <CardHeader className="border-b border-zinc-200 dark:border-zinc-900/50 pb-4 relative z-10 shrink-0">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-500">
                  <Flame className="h-4 w-4" />
                  The Oven
                </CardTitle>
                {hasRoast && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-8 px-3 text-zinc-400 hover:text-orange-500 hover:bg-orange-500/10"
                  >
                    {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                    {copied ? "Copied!" : "Share the Pain"}
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0 relative z-10 flex flex-col h-full"> 
              {/* State: no data */}
              {!hasData ? (
                <div className="p-16 text-center">
                  <div className="h-20 w-20 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mx-auto mb-6 border border-zinc-200 dark:border-zinc-800">
                    <Flame className="h-10 w-10 text-zinc-400 dark:text-zinc-700" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-500 mb-3">The oven is cold</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-600 mb-6">Run a resume analysis first to fuel the roast.</p>
                  <Link href="/dashboard/resume">
                    <Button className="bg-zinc-200 hover:bg-zinc-300 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300">Go to Analyzer</Button>
                  </Link>
                </div>
              ) : !hasRoast && !isRoasting ? (
                /* State: ready to roast */
                <div className="p-16 text-center">
                  <div className="h-24 w-24 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center mx-auto mb-6 border border-orange-200 dark:border-orange-500/20">
                    <Flame className="h-12 w-12 text-orange-600 dark:text-orange-500" />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-widest text-zinc-950 dark:text-zinc-200 mb-4">
                    Ready to feel the heat?
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-500 mb-8 max-w-md mx-auto text-sm leading-relaxed">
                    Based on your {safeScore}% match score and {missingSkills?.length || 0} skill gaps, we'll deliver a
                    multi-paragraph, ego-shattering review. Enter your target role below to begin.
                  </p>
                  
                  <div className="max-w-xs mx-auto mb-8">
                    <Input 
                      placeholder="e.g. Senior Frontend Engineer" 
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="bg-transparent dark:bg-black border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-center placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                    />
                  </div>

                  <Button
                    onClick={handleStartRoasting}
                    className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest px-10 py-6 text-lg rounded-xl shadow-[0_0_30px_rgba(234,88,12,0.35)] transition-all hover:scale-105 active:scale-95"
                  >
                    Start Roasting
                  </Button>
                </div>
              ) : isRoasting ? (
                /* State: loading */
                <div className="p-24 text-center space-y-6">
                  <motion.div
                    animate={{ scale: [1, 1.25, 1], rotate: [0, 12, -12, 0] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                    className="inline-block"
                  >
                    <Flame className="h-20 w-20 text-orange-500 mx-auto" />
                  </motion.div>
                  <p className="text-xl font-black uppercase tracking-[0.25em] text-orange-500 animate-pulse">
                    Preheating oven...
                  </p>
                  <p className="text-sm text-zinc-500 font-mono">Cataloguing your flaws...</p>
                </div>
              ) : (
                /* State: roast displayed */
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-grow flex flex-col">
                  <div className="px-6 pt-6 pb-2 border-b border-zinc-200 dark:border-zinc-900/50 shrink-0">
                    <TabsList className="bg-zinc-100 dark:bg-black/50 border border-zinc-300 dark:border-zinc-800 p-1 rounded-xl w-full justify-start flex-wrap gap-1">
                      {Object.values(PERSONALITIES).map((p) => (
                        <TabsTrigger
                          key={p.id}
                          value={p.id}
                          className="rounded-lg data-[state=active]:bg-orange-100 dark:data-[state=active]:bg-orange-500/15 data-[state=active]:text-orange-700 dark:data-[state=active]:text-orange-400 data-[state=active]:border-orange-200 dark:data-[state=active]:border-orange-500/30 text-zinc-600 dark:text-zinc-500 transition-all font-bold tracking-wider uppercase text-[10px] border border-transparent"
                        >
                          {p.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {/* Scrollable Container for the Roasts */}
                  <div className="overflow-y-auto max-h-[500px] fancy-scrollbar flex-grow">
                    {Object.values(PERSONALITIES).map((p) => (
                      <TabsContent key={p.id} value={p.id} className="p-8 mt-0 w-full h-full">
                        <div className="font-mono text-sm md:text-base leading-relaxed text-zinc-800 dark:text-zinc-300 whitespace-pre-wrap">
                          {roasts[p.id] ? <Typewriter key={p.id + roasts[p.id]} text={roasts[p.id]} /> : null}
                        </div>
                      </TabsContent>
                    ))}
                  </div>

                  {/* Re-roast */}
                  <div className="px-8 pb-6 border-t border-zinc-200 dark:border-zinc-900/50 pt-4 shrink-0 bg-white/50 dark:bg-zinc-950">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setHasRoast(false);
                        setTargetRole(""); // Let them type a new one if they want
                      }}
                      className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-orange-500 bg-transparent"
                    >
                      <Flame className="h-3 w-3 mr-1.5" />
                      Roast again
                    </Button>
                  </div>
                </Tabs>
              )}
            </CardContent>
          </Card>

          {/* Cool Down */}
          {hasRoast && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={handleCoolDown}
                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
              >
                Okay, I'm crying. Help me fix this.
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* RIGHT — Burn Meter + Missing Skills */}
        <div className="space-y-6 lg:sticky lg:top-8">
          {/* Burn Meter */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/40 backdrop-blur-xl rounded-2xl overflow-hidden shadow-sm shadow-blue-500/5 dark:shadow-none">
            <CardHeader className="pb-2 border-b border-zinc-200 dark:border-zinc-900">
              <CardTitle className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-500">
                <Flame className="h-4 w-4" />
                Burn Meter
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-10">
              <div className="relative h-48 w-48">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  {/* Track */}
                  <circle strokeWidth="10" fill="none" className="stroke-zinc-200 dark:stroke-zinc-800" r="40" cx="50" cy="50" />
                  {/* Burn arc */}
                  {hasData && (
                    <motion.circle
                      stroke={burnColor}
                      strokeWidth="10"
                      fill="none"
                      r="40"
                      cx="50"
                      cy="50"
                      strokeLinecap="round"
                      strokeDasharray={CIRCUMFERENCE}
                      initial={{ strokeDashoffset: CIRCUMFERENCE }}
                      animate={{ strokeDashoffset: CIRCUMFERENCE - (CIRCUMFERENCE * burnLevel) / 100 }}
                      transition={{ duration: 2.2, ease: "circOut", delay: 0.4 }}
                      style={{ filter: `drop-shadow(0 0 10px ${burnColor}80)` }}
                    />
                  )}
                </svg>
                {/* Centre label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className={`text-5xl font-black tabular-nums leading-none ${
                      hasData ? "text-zinc-950 dark:text-zinc-100" : "text-zinc-300 dark:text-zinc-800"
                    }`}
                  >
                    {hasData ? burnLevel : 0}%
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 mt-2">Charred</span>
                </div>
              </div>

              {hasData && (
                <div className="mt-6 text-center space-y-1">
                  <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                    Status:{" "}
                    <span className="font-black" style={{ color: burnColor }}>
                      {burnLevel > 80 ? "BEYOND REPAIR" : burnLevel > 50 ? "CRISPY" : "WARM"}
                    </span>
                  </p>
                  <p className="text-[10px] text-zinc-600 dark:text-zinc-700 uppercase tracking-widest">
                    Match: {safeScore}% • Burned: {burnLevel}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Missing Skills — Fuel */}
          {hasData && missingSkills?.length > 0 && (
            <Card className="border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/40 backdrop-blur-xl rounded-2xl shadow-sm shadow-blue-500/5 dark:shadow-none">
              <CardHeader className="pb-4 border-b border-zinc-200 dark:border-zinc-900">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                  Fuel for the fire
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="flex flex-wrap gap-2">
                  {missingSkills.slice(0, 12).map((item: any) => (
                    <span
                      key={item.skill}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        item.is_critical
                          ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-red-500/10 dark:text-red-400 border dark:border-red-500/20"
                          : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 border dark:border-zinc-700/60"
                      }`}
                    >
                      {item.skill}
                    </span>
                  ))}
                  {missingSkills.length > 12 && (
                    <span className="px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-zinc-200 text-zinc-600 border border-zinc-300 dark:bg-zinc-900 dark:text-zinc-600 dark:border-zinc-900">
                      +{missingSkills.length - 12} more
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
