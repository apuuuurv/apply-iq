"use client"

import { LandingHero } from "@/components/landing/hero"
import { LandingFeatures } from "@/components/landing/features"
import { LandingCTA } from "@/components/landing/cta"
import { LandingNav } from "@/components/landing/nav"
import { LandingFooter } from "@/components/landing/footer"
import { AuroraBackground } from "@/components/ui/aurora-background"
import { LandingFAQ } from "@/components/landing/faq"
import { LandingHowItWorks } from "@/components/landing/how-it-works"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main>
        <AuroraBackground>
          <LandingHero />
        </AuroraBackground>
        <LandingHowItWorks />
        <LandingFeatures />
        <LandingFAQ />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  )
}
