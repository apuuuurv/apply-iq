"use client"

import { motion } from "framer-motion"
import {
  FileSearch,
  BarChart3,
  Target,
  Bell,
  Zap,
  Shield,
} from "lucide-react"

const features = [
  {
    name: "AI Resume Analysis",
    description:
      "Get instant feedback on your resume with AI-powered analysis. Identify strengths and areas for improvement.",
    icon: FileSearch,
  },
  {
    name: "Job Application Tracker",
    description:
      "Keep all your applications organized in one place. Track status, deadlines, and follow-ups effortlessly.",
    icon: BarChart3,
  },
  {
    name: "Skill Gap Insights",
    description:
      "Compare your skills against job requirements. Know exactly what to learn to become the ideal candidate.",
    icon: Target,
  },
  {
    name: "Smart Notifications",
    description:
      "Never miss an opportunity. Get reminders for follow-ups, interviews, and application deadlines.",
    icon: Bell,
  },
  {
    name: "Match Scoring",
    description:
      "See how well your resume matches each job description with our intelligent scoring system.",
    icon: Zap,
  },
  {
    name: "Data Privacy",
    description:
      "Your data is encrypted and secure. We never share your information with third parties.",
    icon: Shield,
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
}

export function LandingFeatures() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold tracking-tight sm:text-4xl text-balance"
          >
            Everything you need to land your dream job
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg text-muted-foreground text-pretty"
          >
            Powerful tools to streamline your job search and maximize your
            chances of success.
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.name}
              variants={itemVariants}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:border-accent/50 hover:shadow-lg"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-accent/10">
                <feature.icon className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-accent" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.name}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
