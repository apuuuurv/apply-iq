import React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster as ShadcnToaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { Preloader } from "@/components/preloader"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ApplyIQ - AI Job Application Tracker",
  description:
    "Track your job applications, analyze your resume with AI, and get hired faster with intelligent insights.",

  icons: {
    icon: [
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/icon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Preloader />
          {children}
          <ShadcnToaster />
          <SonnerToaster position="top-center" richColors />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
