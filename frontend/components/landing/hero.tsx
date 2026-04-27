"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Upload, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function LandingHero() {
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  return (
    <section id="home" className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
      {/* Background provided by AuroraBackground wrapper */}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground/90 font-medium">The Future of Job Tracking is here</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl text-balance"
          >
            <span className="text-foreground/90">Track Jobs.</span>{" "}
            <span className="bg-gradient-to-br from-primary via-aurora-2 to-aurora-1 bg-clip-text text-transparent italic">
              Optimize Results.
            </span>{" "}
            <span className="text-foreground/90">Master Careers.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-8 text-xl leading-relaxed text-muted-foreground/90 sm:text-2xl text-pretty max-w-2xl mx-auto"
          >
            ApplyIQ is your intelligent command center for job hunting. Leverage AI to bridge skill gaps and land your next role in record time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href={user ? "/dashboard" : "/register"}>
              <Button size="lg" className="group h-12 px-8 rounded-full shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all">
                {user ? "Go to Dashboard" : "Get Started"}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/dashboard/resume">
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 rounded-full border-zinc-200 dark:border-white/30 bg-white/10 dark:bg-white/10 backdrop-blur-md hover:bg-zinc-100 dark:hover:bg-white/20 transition-all group shadow-sm"
              >
                <Upload className="mr-2 h-4 w-4 text-zinc-950 dark:text-white group-hover:scale-110 transition-transform" />
                <span className="text-zinc-950 dark:text-white font-medium">Upload Resume</span>
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 text-sm text-muted-foreground"
          >
            Trusted by job seekers at
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 opacity-60"
          >
            {["Google", "Meta", "Amazon", "Microsoft", "Apple"].map((company) => (
              <span
                key={company}
                className="text-lg font-semibold tracking-tight text-muted-foreground"
              >
                {company}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="relative mt-20"
        >
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-transparent to-transparent" />
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
            <div className="flex h-10 items-center gap-2 border-b border-border bg-muted/30 px-4">
              <div className="h-3 w-3 rounded-full bg-destructive/60" />
              <div className="h-3 w-3 rounded-full bg-warning/60" />
              <div className="h-3 w-3 rounded-full bg-success/60" />
              <span className="ml-4 text-xs text-muted-foreground">
                dashboard.applyiq.com
              </span>
            </div>
            <div className="aspect-[16/9] bg-gradient-to-br from-muted/20 to-muted/40 p-8">
              <div className="grid h-full grid-cols-12 gap-4">
                {/* Sidebar */}
                <div className="col-span-3 rounded-lg bg-card/60 p-4">
                  <div className="mb-6 h-8 w-24 rounded bg-muted/50" />
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-8 rounded ${i === 0 ? "bg-primary/20" : "bg-muted/30"}`}
                      />
                    ))}
                  </div>
                </div>
                {/* Main content */}
                <div className="col-span-9 space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="rounded-lg bg-card/60 p-4">
                        <div className="mb-2 h-4 w-16 rounded bg-muted/50" />
                        <div className="h-8 w-12 rounded bg-muted/30" />
                      </div>
                    ))}
                  </div>
                  <div className="h-48 rounded-lg bg-card/60 p-4">
                    <div className="mb-4 h-4 w-32 rounded bg-muted/50" />
                    <div className="space-y-2">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-muted/30" />
                          <div className="flex-1">
                            <div className="mb-1 h-3 w-32 rounded bg-muted/40" />
                            <div className="h-2 w-24 rounded bg-muted/30" />
                          </div>
                          <div className="h-6 w-16 rounded-full bg-accent/20" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
