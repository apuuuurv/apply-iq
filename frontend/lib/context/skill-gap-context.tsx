"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface SkillGap {
  skill: string
  weight: number
  is_critical: boolean
}

interface SkillGapContextType {
  missingSkills: SkillGap[]
  setMissingSkills: (skills: SkillGap[]) => void
  matchedSkills: string[]
  setMatchedSkills: (skills: string[]) => void
  matchScore: number
  setMatchScore: (score: number) => void
  lastAnalysisDate: string | null
  setLastAnalysisDate: (date: string) => void
  clearAll: () => void
}

const SkillGapContext = createContext<SkillGapContextType | undefined>(undefined)

export function SkillGapProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [missingSkills, setMissingSkillsState] = useState<SkillGap[]>([])
  const [matchedSkills, setMatchedSkillsState] = useState<string[]>([])
  const [matchScore, setMatchScoreState] = useState<number>(0)
  const [lastAnalysisDate, setLastAnalysisDateState] = useState<string | null>(null)

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.id) {
        setUserId(session.user.id)
      } else {
        setUserId(null)
        clearAllState()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const clearAllState = () => {
    setMissingSkillsState([])
    setMatchedSkillsState([])
    setMatchScoreState(0)
    setLastAnalysisDateState(null)
  }

  // Load from localStorage when userId is available
  useEffect(() => {
    if (!userId) return

    const savedMissing = localStorage.getItem(`applyiq_${userId}_missing_skills`)
    const savedMatched = localStorage.getItem(`applyiq_${userId}_matched_skills`)
    const savedScore = localStorage.getItem(`applyiq_${userId}_match_score`)
    const savedDate = localStorage.getItem(`applyiq_${userId}_last_analysis_date`)
    
    if (savedMissing) {
      try {
        setMissingSkillsState(JSON.parse(savedMissing))
      } catch (e) {
        console.error("Failed to parse saved missing skills", e)
      }
    } else {
      setMissingSkillsState([])
    }

    if (savedMatched) {
      try {
        setMatchedSkillsState(JSON.parse(savedMatched))
      } catch (e) {
        console.error("Failed to parse saved matched skills", e)
      }
    } else {
      setMatchedSkillsState([])
    }

    if (savedScore) {
      setMatchScoreState(parseInt(savedScore))
    } else {
      setMatchScoreState(0)
    }
    
    if (savedDate) {
      setLastAnalysisDateState(savedDate)
    } else {
      setLastAnalysisDateState(null)
    }
  }, [userId])

  const setMissingSkills = (skills: SkillGap[]) => {
    setMissingSkillsState(skills)
    if (userId) {
      localStorage.setItem(`applyiq_${userId}_missing_skills`, JSON.stringify(skills))
    }
  }

  const setMatchedSkills = (skills: string[]) => {
    setMatchedSkillsState(skills)
    if (userId) {
      localStorage.setItem(`applyiq_${userId}_matched_skills`, JSON.stringify(skills))
    }
  }

  const setMatchScore = (score: number) => {
    setMatchScoreState(score)
    if (userId) {
      localStorage.setItem(`applyiq_${userId}_match_score`, score.toString())
    }
  }

  const setLastAnalysisDate = (date: string) => {
    setLastAnalysisDateState(date)
    if (userId) {
      localStorage.setItem(`applyiq_${userId}_last_analysis_date`, date)
    }
  }

  const clearAll = () => {
    if (userId) {
      localStorage.removeItem(`applyiq_${userId}_missing_skills`)
      localStorage.removeItem(`applyiq_${userId}_matched_skills`)
      localStorage.removeItem(`applyiq_${userId}_match_score`)
      localStorage.removeItem(`applyiq_${userId}_last_analysis_date`)
      localStorage.removeItem(`applyiq_${userId}_current_jd`)
    }
    clearAllState()
  }

  return (
    <SkillGapContext.Provider
      value={{
        missingSkills,
        setMissingSkills,
        matchedSkills,
        setMatchedSkills,
        matchScore,
        setMatchScore,
        lastAnalysisDate,
        setLastAnalysisDate,
        clearAll
      }}
    >
      {children}
    </SkillGapContext.Provider>
  )
}

export function useSkillGap() {
  const context = useContext(SkillGapContext)
  if (context === undefined) {
    throw new Error("useSkillGap must be used within a SkillGapProvider")
  }
  return context
}
