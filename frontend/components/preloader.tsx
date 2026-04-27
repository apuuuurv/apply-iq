"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function Preloader() {
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isFirstVisit, setIsFirstVisit] = useState(true)
  const [step, setStep] = useState(0)

  useEffect(() => {
    setMounted(true)
    const hasVisited = sessionStorage.getItem("applyiq_preloader_seen_v3")
    if (hasVisited === "true") {
      setIsFirstVisit(false)
      setStep(1)
    } else {
      setIsFirstVisit(true)
      setStep(1)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.body.style.overflow = isLoading ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [mounted, isLoading])

  useEffect(() => {
    if (!mounted) return
    let timer: NodeJS.Timeout

    if (isFirstVisit) {
      switch (step) {
        case 1:
          timer = setTimeout(() => setStep(2), 1800) // Logo (Quick & Impactful)
          break
        case 2:
          timer = setTimeout(() => setStep(3), 2500) // Vaidik (Readable)
          break
        case 3:
          timer = setTimeout(() => setStep(4), 2500) // Akshay (Readable)
          break
        case 4:
          timer = setTimeout(() => setStep(5), 3500) // Apurv (Greatest Highlight)
          break
        case 5:
          sessionStorage.setItem("applyiq_preloader_seen_v3", "true")
          setIsLoading(false)
          break
      }
    } else {
      if (step === 1) timer = setTimeout(() => setStep(5), 1500)
      else if (step === 5) setIsLoading(false)
    }
    return () => clearTimeout(timer)
  }, [step, isFirstVisit, mounted])

  if (!mounted) return <div className="fixed inset-0 z-[9999] bg-zinc-950" />

  // Faster transition variant to ensure text stays visible longer
  const textVariants = {
    initial: { opacity: 0, y: 15, filter: "blur(10px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, y: -15, filter: "blur(10px)" }
  }

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{
            y: "-100%",
            transition: { duration: 1, ease: [0.7, 0, 0.3, 1] }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950 overflow-hidden"
        >
          {/* --- LIGHT LEAK EFFECTS --- */}
          <motion.div
            animate={{
              x: [-500, 500],
              opacity: [0, 0.3, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-[linear-gradient(45deg,transparent_20%,rgba(34,211,238,0.15)_50%,transparent_80%)] skew-x-12 pointer-events-none"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(8,145,178,0.1),transparent_70%)]" />

          <div className="relative z-10 w-full max-w-5xl px-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="logo"
                  variants={textVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="flex flex-col items-center"
                >
                  <h1 className="text-6xl font-black tracking-tighter text-white drop-shadow-[0_0_30px_rgba(34,211,238,0.4)] md:text-8xl">
                    Apply<span className="text-cyan-400">IQ</span>
                  </h1>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "120px" }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="mt-4 h-[2px] bg-cyan-500"
                  />
                </motion.div>
              )}

              {step === 2 && (
                <motion.h2
                  key="vaidik"
                  variants={textVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.5 }}
                  className="text-2xl font-light uppercase tracking-[0.3em] text-zinc-300 md:text-4xl"
                >
                  Engineered By <span className="font-bold text-white tracking-normal">Vaidik</span>
                </motion.h2>
              )}

              {step === 3 && (
                <motion.h2
                  key="akshay"
                  variants={textVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.5 }}
                  className="text-2xl font-light uppercase tracking-[0.3em] text-zinc-300 md:text-4xl"
                >
                  Documented By <span className="font-bold text-white tracking-normal">Akshay</span>
                </motion.h2>
              )}

              {step === 4 && (
                <motion.h2
                  key="apurv"
                  variants={textVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.6 }}
                  className="text-2xl font-light uppercase tracking-[0.3em] text-zinc-300 md:text-5xl"
                >
                  Developed By <span className="font-bold text-white tracking-normal drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">Apurv</span>
                </motion.h2>
              )}
            </AnimatePresence>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 overflow-hidden w-48 h-[1px] bg-zinc-800">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-full h-full bg-cyan-500 shadow-[0_0_10px_#22d3ee]"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}