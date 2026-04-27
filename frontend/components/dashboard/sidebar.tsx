"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Briefcase,
  FileSearch,
  Target,
  Flame,
  Bell,
  Settings,
  LogOut,
  X,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Applications",
    href: "/dashboard/applications",
    icon: Briefcase,
    badge: null as number | null,
  },
  {
    name: "Resume Analyzer",
    href: "/dashboard/resume",
    icon: FileSearch,
  },
  {
    name: "Skill Gap Analysis",
    href: "/dashboard/skills",
    icon: Target,
  },
  {
    name: "Resume Roaster",
    href: "/dashboard/roaster",
    icon: Flame,
  },
  {
    name: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    badge: null as number | null,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

interface DashboardSidebarProps {
  onClose?: () => void
}

export function DashboardSidebar({ onClose }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [applicationCount, setApplicationCount] = useState(0)
  const [notificationCount, setNotificationCount] = useState(0)
  const [navItems, setNavItems] = useState(navigation)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.log('No user logged in')
          return
        }

        setUser(user)

        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
        } else {
          setProfile(profileData)
        }

        // Fetch application count
        const { count: appCount, error: appError } = await supabase
          .from('job_applications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)

        if (!appError) {
          setApplicationCount(appCount || 0)
        }

        // Fetch unread notification count
        const { count: notifCount, error: notifError } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false)

        if (!notifError) {
          setNotificationCount(notifCount || 0)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }

    fetchUserData()
  }, [supabase])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success("Logged out successfully")
      router.push("/login")
    } catch (error) {
      console.error('Logout error:', error)
      toast.error("Failed to logout")
    }
  }

  const userName = profile?.full_name || user?.user_metadata?.full_name || "User"
  const userEmail = user?.email || "user@example.com"
  const initials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() || "U"

  return (
    <div className="flex h-full w-64 flex-col border-r border-zinc-200 dark:border-sidebar-border bg-zinc-100 dark:bg-sidebar">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-200 dark:border-sidebar-border px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Briefcase className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
            ApplyIQ
          </span>
        </Link>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Back to Home Link */}
      <div className="px-3 pt-4">
        <Link 
          href="/" 
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 dark:text-sidebar-foreground/60 hover:bg-zinc-200/50 dark:hover:bg-sidebar-accent/50 hover:text-zinc-900 dark:hover:text-sidebar-foreground transition-all"
        >
          <Target className="h-5 w-5 rotate-180" /> {/* Using Target as a substitute for Home for now or importing Home */}
          <span>Back to Landing</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          
          // Get dynamic badge count
          let badgeCount = null
          if (item.name === "Applications") {
            badgeCount = applicationCount
          } else if (item.name === "Notifications") {
            badgeCount = notificationCount
          }
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-blue-50 text-blue-600 dark:bg-sidebar-accent dark:text-sidebar-accent-foreground"
                  : "text-zinc-600 dark:text-sidebar-foreground/70 hover:bg-zinc-200/50 dark:hover:bg-sidebar-accent/50 hover:text-zinc-900 dark:hover:text-sidebar-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive
                    ? "text-blue-600 dark:text-sidebar-primary"
                    : "text-zinc-400 dark:text-sidebar-foreground/50 group-hover:text-zinc-600 dark:group-hover:text-sidebar-foreground/70"
                )}
              />
              <span className="flex-1">{item.name}</span>
              {badgeCount !== null && badgeCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-auto h-5 min-w-[20px] px-1.5 text-xs"
                >
                  {badgeCount}
                </Badge>
              )}
              {isActive && (
                <ChevronRight className="h-4 w-4 text-sidebar-foreground/50" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-zinc-200 dark:border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.avatar_url || "https://github.com/shadcn.png"} alt="User" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-sidebar-foreground">
              {userName}
            </p>
            <p className="truncate text-xs text-zinc-500 dark:text-sidebar-foreground/60">
              {userEmail}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-zinc-500 hover:text-zinc-900 dark:text-sidebar-foreground/60 dark:hover:text-sidebar-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
