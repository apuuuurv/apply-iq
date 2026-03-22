"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

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
}

const SkillGapContext = createContext<SkillGapContextType | undefined>(undefined)

export function SkillGapProvider({ children }: { children: React.ReactNode }) {
  const [missingSkills, setMissingSkillsState] = useState<SkillGap[]>([])
  const [matchedSkills, setMatchedSkillsState] = useState<string[]>([])
  const [matchScore, setMatchScoreState] = useState<number>(0)
  const [lastAnalysisDate, setLastAnalysisDateState] = useState<string | null>(null)

  // Load from localStorage on init
  useEffect(() => {
    const savedMissing = localStorage.getItem("applyiq_missing_skills")
    const savedMatched = localStorage.getItem("applyiq_matched_skills")
    const savedScore = localStorage.getItem("applyiq_match_score")
    const savedDate = localStorage.getItem("applyiq_last_analysis_date")
    
    if (savedMissing) {
      try {
        setMissingSkillsState(JSON.parse(savedMissing))
      } catch (e) {
        console.error("Failed to parse saved missing skills", e)
      }
    }

    if (savedMatched) {
      try {
        setMatchedSkillsState(JSON.parse(savedMatched))
      } catch (e) {
        console.error("Failed to parse saved matched skills", e)
      }
    }

    if (savedScore) {
      setMatchScoreState(parseInt(savedScore))
    }
    
    if (savedDate) {
      setLastAnalysisDateState(savedDate)
    }
  }, [])

  const setMissingSkills = (skills: SkillGap[]) => {
    setMissingSkillsState(skills)
    localStorage.setItem("applyiq_missing_skills", JSON.stringify(skills))
  }

  const setMatchedSkills = (skills: string[]) => {
    setMatchedSkillsState(skills)
    localStorage.setItem("applyiq_matched_skills", JSON.stringify(skills))
  }

  const setMatchScore = (score: number) => {
    setMatchScoreState(score)
    localStorage.setItem("applyiq_match_score", score.toString())
  }

  const setLastAnalysisDate = (date: string) => {
    setLastAnalysisDateState(date)
    localStorage.setItem("applyiq_last_analysis_date", date)
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
