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
    <section id="features" className="py-16 sm:py-20">
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
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { type: "spring", stiffness: 400, damping: 10 } 
              }}
              className="group relative overflow-hidden rounded-2xl p-8 liquid-glass liquid-glass-hover cursor-pointer"
            >
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-all duration-500 group-hover:bg-primary group-hover:text-primary-foreground group-hover:rotate-[360deg] shadow-lg group-hover:shadow-primary/40">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-bold tracking-tight group-hover:text-primary transition-colors">
                {feature.name}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground/80 group-hover:text-muted-foreground transition-colors">
                {feature.description}
              </p>
              <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
