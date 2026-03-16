"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Upload, Sparkles } from "lucide-react"

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-accent/20 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-muted-foreground">AI-Powered Job Search Assistant</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-balance"
          >
            Track Jobs.{" "}
            <span className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              Optimize Resume.
            </span>{" "}
            Get Hired Faster.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl text-pretty"
          >
            ApplyIQ helps you manage your job applications, analyze your resume
            against job descriptions, and identify skill gaps to land your dream
            job faster.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/register">
              <Button size="lg" className="group h-12 px-6">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/dashboard/resume">
              <Button variant="outline" size="lg" className="h-12 px-6 bg-transparent">
                <Upload className="mr-2 h-4 w-4" />
                Upload Resume
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
