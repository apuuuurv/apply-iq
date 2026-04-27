"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { motion } from "framer-motion"

const faqs = [
  {
    question: "How does ApplyIQ help with my job search?",
    answer: "ApplyIQ provides tools to track your applications, analyze your resume against job descriptions using AI, and identify skill gaps to help you improve your chances of getting hired.",
  },
  {
    question: "Is my data secure?",
    answer: "Yes, we take security seriously. Your resumes and application data are encrypted and stored securely using Supabase, ensuring only you have access to your information.",
  },
  {
    question: "Can I track multiple versions of my resume?",
    answer: "Absolutely! You can upload different versions of your resume and see how each one performs against various job descriptions.",
  },
  {
    question: "Does ApplyIQ offer automated application services?",
    answer: "Currently, ApplyIQ focuses on tracking and analysis. We provide the insights you need to apply more effectively, but we don't automate the application submission process to ensure quality control.",
  },
]

export function LandingFAQ() {
  return (
    <section id="faq" className="py-16 sm:py-20 bg-background relative overflow-hidden">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-center mb-12 sm:text-4xl">
          Frequently Asked Questions
        </h2>
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="rounded-3xl liquid-glass p-1 sm:p-2"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 }
                }}
                whileHover={{ 
                  scale: 1.01,
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  transition: { duration: 0.2 }
                }}
                className="rounded-2xl transition-all duration-300"
              >
                <AccordionItem value={`item-${index}`} className="border-none px-6">
                  <AccordionTrigger className="text-left text-lg font-medium hover:no-underline hover:text-primary transition-colors py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground/90 text-base leading-relaxed pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
