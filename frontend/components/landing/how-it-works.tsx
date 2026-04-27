"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Upload, Search, CheckCircle, Sparkles } from "lucide-react"

const steps = [
  {
    title: "Upload Your Resume",
    description: "Upload your current resume in PDF or Word format. We'll extract your skills and experience.",
    icon: Upload,
  },
  {
    title: "Find a Job Description",
    description: "Paste the job description of a role you're interested in. We'll analyze it for key requirements.",
    icon: Search,
  },
  {
    title: "Get AI Insights",
    description: "Our AI compares your resume to the job description and highlights skill gaps and improvements.",
    icon: Sparkles,
  },
  {
    title: "Optimize and Apply",
    description: "Use our tailored suggestions to improve your resume and apply with confidence.",
    icon: CheckCircle,
  },
]

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 bg-muted/30 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-center mb-16 sm:text-4xl">
          Start your journey in 4 simple steps
        </h2>
        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.15
              }
            }
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {steps.map((step, index) => (
            <motion.div 
              key={index} 
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { 
                  opacity: 1, 
                  y: 0,
                  transition: { type: "spring", stiffness: 100 }
                }
              }}
              whileHover={{ 
                y: -10,
                transition: { type: "spring", stiffness: 400, damping: 10 }
              }}
              className="group relative rounded-2xl p-8 liquid-glass liquid-glass-hover cursor-pointer overflow-hidden"
            >
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-all duration-500 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 shadow-lg group-hover:shadow-primary/40">
                <step.icon className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-xl font-bold group-hover:text-primary transition-colors">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground/80 group-hover:text-muted-foreground transition-colors">
                {step.description}
              </p>
              <div className="absolute top-4 right-6 text-5xl font-black text-white/[0.03] group-hover:text-primary/[0.08] transition-colors pointer-events-none invisible" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
