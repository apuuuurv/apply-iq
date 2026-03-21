"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function LandingCTA() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="relative overflow-hidden rounded-3xl px-6 py-20 sm:px-16 sm:py-28 liquid-glass"
        >
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[120px]" />
            <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-aurora-2/10 blur-[120px]" />
          </div>

          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-balance">
              Ready to accelerate your job search?
            </h2>
            <p className="mt-6 text-xl text-muted-foreground/80 text-pretty">
              Join thousands of job seekers who have found success with ApplyIQ.
              Start tracking your applications and optimizing your resume today.
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row">
              <Link href="/register">
                <Button
                  size="lg"
                  className="group h-14 px-10 rounded-full shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all font-semibold"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-14 px-10 text-foreground hover:bg-white/5 rounded-full font-medium"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
