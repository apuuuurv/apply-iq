"use client"

import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Briefcase, Menu, X, LayoutDashboard, LogOut } from "lucide-react"
import { useState, useEffect } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4"
    >
      <nav className="flex h-14 max-w-fit items-center gap-8 px-6 liquid-glass rounded-full">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary group-hover:rotate-12 transition-transform duration-300">
            <Briefcase className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            ApplyIQ
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {[
            { name: "Features", href: "#features" },
            { name: "How It Works", href: "#how-it-works" },
            { name: "FAQ", href: "#faq" },
          ].map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-all hover:text-foreground hover:scale-105"
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          
          {user ? (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                className="hidden md:flex text-muted-foreground hover:text-destructive transition-colors"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
              <Link href="/dashboard">
                <Button size="sm" className="rounded-full px-5 bg-primary hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="hidden md:flex text-muted-foreground hover:text-foreground">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="rounded-full px-5 bg-primary hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20">
                  Get Started
                </Button>
              </Link>
            </>
          )}
          
          <button
            type="button"
            className="md:hidden p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute top-16 left-4 right-4 liquid-glass rounded-2xl p-4 md:hidden"
          >
            <div className="flex flex-col gap-2">
              {[
                { name: "Features", href: "#features" },
                { name: "How It Works", href: "#how-it-works" },
                { name: "FAQ", href: "#faq" },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.name}
                </Link>
              ))}
              <div className="h-px bg-white/10 my-2" />
              <div className="flex items-center justify-between px-4">
                <ThemeToggle />
                <div className="flex gap-2">
                  {user ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={handleLogout}>Sign out</Button>
                      <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <Button size="sm">Dashboard</Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" size="sm">Sign in</Button>
                      </Link>
                      <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                        <Button size="sm">Get Started</Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
