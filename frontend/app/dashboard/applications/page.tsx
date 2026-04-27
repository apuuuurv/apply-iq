"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  MapPin,
  Calendar,
  ExternalLink,
  Zap,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  getJobApplications,
  createJobApplication,
  updateJobApplication,
  deleteJobApplication,
  type JobApplication,
} from "@/lib/supabase/actions/applications"
import { createNotification } from "@/lib/supabase/actions/notifications"

type ApplicationStatus = "applied" | "interview" | "offer" | "rejected"

const statusOptions: { value: ApplicationStatus; label: string }[] = [
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
]

const statusColors: Record<ApplicationStatus, string> = {
  applied: "bg-muted text-muted-foreground",
  interview: "bg-accent/20 text-accent",
  offer: "bg-success/20 text-success",
  rejected: "bg-destructive/20 text-destructive",
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedApplication, setSelectedApplication] =
    useState<JobApplication | null>(null)
  const [formData, setFormData] = useState<{
    company: string;
    role: string;
    location: string;
    salary: string;
    notes: string;
    status: ApplicationStatus;
    match_score: number;
  }>({
    company: "",
    role: "",
    location: "",
    salary: "",
    notes: "",
    status: "applied",
    match_score: 0,
  })

  // Load applications on mount
  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      setLoading(true)
      const data = await getJobApplications()
      setApplications(data)
    } catch (error) {
      console.error("Error loading applications:", error)
      toast.error("Failed to load applications")
    } finally {
      setLoading(false)
    }
  }

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.role.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      statusFilter === "all" || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleAddApplication = async () => {
    if (!formData.company || !formData.role) {
      toast.error("Company and role are required")
      return
    }

    try {
      const app = await createJobApplication({
        company: formData.company,
        role: formData.role,
        location: formData.location,
        salary: formData.salary,
        notes: formData.notes,
        status: formData.status,
      })
      
      if (app && app.id && formData.match_score) {
        localStorage.setItem(`match_score_${app.id}`, formData.match_score.toString())
      }
      
      setIsAddModalOpen(false)
      resetForm()
      toast.success("Application added successfully!")
      
      // Create notification
      try {
        await createNotification({
          title: "New Application Added",
          description: `Applied to ${formData.company} as ${formData.role}`,
          type: "update",
        })
      } catch (notifError) {
        console.error("Error creating notification:", notifError)
      }
      
      await loadApplications()
    } catch (error) {
      console.error("Error adding application:", error)
      toast.error("Failed to add application")
    }
  }

  const handleEditApplication = async () => {
    if (!selectedApplication?.id || !formData.company || !formData.role) {
      toast.error("Company and role are required")
      return
    }

    try {
      await updateJobApplication(selectedApplication.id, {
        company: formData.company,
        role: formData.role,
        location: formData.location,
        salary: formData.salary,
        notes: formData.notes,
        status: formData.status,
      })
      
      if (formData.match_score) {
        localStorage.setItem(`match_score_${selectedApplication.id}`, formData.match_score.toString())
      }
      
      setIsEditModalOpen(false)
      setSelectedApplication(null)
      resetForm()
      toast.success("Application updated successfully!")
      await loadApplications()
    } catch (error) {
      console.error("Error updating application:", error)
      toast.error("Failed to update application")
    }
  }

  const handleDeleteApplication = async () => {
    if (!selectedApplication?.id) return

    try {
      await deleteJobApplication(selectedApplication.id)
      setIsDeleteModalOpen(false)
      setSelectedApplication(null)
      toast.success("Application deleted!")
      await loadApplications()
    } catch (error) {
      console.error("Error deleting application:", error)
      toast.error("Failed to delete application")
    }
  }

  const openEditModal = (app: JobApplication) => {
    setSelectedApplication(app)
    setFormData({
      company: app.company,
      role: app.role,
      location: app.location || "",
      salary: app.salary || "",
      notes: app.notes || "",
      status: (app.status as ApplicationStatus) || "applied",
      match_score: (app as any).match_score || 0,
    })
    setIsEditModalOpen(true)
  }

  const openDeleteModal = (app: JobApplication) => {
    setSelectedApplication(app)
    setIsDeleteModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      company: "",
      role: "",
      location: "",
      salary: "",
      notes: "",
      status: "applied",
      match_score: 0 as any,
    })
  }

  const columns: { id: ApplicationStatus; label: string; icon: any; color: string }[] = [
    { id: "applied", label: "Applied", icon: Calendar, color: "text-zinc-500" },
    { id: "interview", label: "Interview", icon: Zap, color: "text-blue-500" },
    { id: "offer", label: "Offer", icon: CheckCircle2, color: "text-green-500" },
    { id: "rejected", label: "Rejected", icon: Trash2, color: "text-red-500" },
  ]

  const handleStatusChange = async (id: string, newStatus: ApplicationStatus) => {
    try {
      await updateJobApplication(id, { status: newStatus })
      toast.success(`Moved to ${newStatus}`)
      
      // Create notification
      const app = applications.find(a => a.id === id)
      if (app) {
        try {
          await createNotification({
            title: "Application Updated",
            description: `Moved ${app.company} application to ${newStatus}`,
            type: newStatus === "interview" ? "interview" : "update",
          })
        } catch (notifError) {
          console.error("Error creating notification:", notifError)
        }
      }
      
      await loadApplications()
    } catch (error) {
      toast.error("Failed to update status")
    }
  }

  // Drag and Drop Handlers
  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("applicationId", id)
    e.dataTransfer.effectAllowed = "move"
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const onDrop = async (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault()
    const id = e.dataTransfer.getData("applicationId")
    if (id) {
      const app = applications.find(a => a.id === id)
      if (app && app.status !== status) {
        await handleStatusChange(id, status)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#22d3ee]" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-4xl text-zinc-950 dark:text-white uppercase italic">
            Application Tracker
          </h1>
          <p className="mt-2 text-sm text-muted-foreground font-bold uppercase tracking-[0.2em]">
            Manage your pipeline with AI precision
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-[#22d3ee] transition-colors" />
            <Input
              placeholder="SEARCH PIPELINE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-[200px] md:w-[300px] bg-muted/5 border-zinc-800 text-[10px] font-black uppercase tracking-widest focus-visible:ring-[#22d3ee] h-11 rounded-xl"
            />
          </div>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#22d3ee] text-zinc-950 font-black uppercase tracking-widest hover:bg-[#22d3ee]/90 h-11 px-6 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.2)]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Application
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
        {columns.map((column) => {
          const columnApps = filteredApplications.filter(app => app.status === column.id)
          return (
            <div key={column.id} className="flex flex-col gap-4 min-h-[500px]">
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 pb-2 border-b border-zinc-200 dark:border-zinc-800/50">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800", column.color)}>
                    <column.icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                    {column.label}
                  </h3>
                </div>
                <Badge variant="outline" className="text-[9px] font-black border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500">
                  {columnApps.length}
                </Badge>
              </div>

              {/* Column Content */}
              <div 
                className="flex-1 space-y-4 rounded-2xl bg-zinc-50/50 dark:bg-muted/5 p-2 min-h-[200px] border border-zinc-200 dark:border-zinc-800/20"
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, column.id)}
              >
                <AnimatePresence mode="popLayout">
                  {columnApps.map((app, idx) => (
                    <motion.div
                      key={app.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                      draggable
                      onDragStart={(e) => onDragStart(e, app.id!)}
                    >
                      <Card className="group border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 backdrop-blur-sm hover:border-cyan-500/30 dark:hover:border-[#22d3ee]/30 transition-all cursor-grab active:cursor-grabbing overflow-hidden shadow-sm dark:shadow-none">
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-black text-zinc-900 dark:text-zinc-100 group-hover:border-cyan-500/50 dark:group-hover:border-[#22d3ee]/50 transition-colors">
                                {app.company.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <h4 className="truncate font-black text-sm text-zinc-950 dark:text-zinc-100 uppercase tracking-tight">
                                  {app.company}
                                </h4>
                                <p className="truncate text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                  {app.role}
                                </p>
                              </div>
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-950 dark:text-zinc-500 dark:hover:text-white">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                                <DropdownMenuItem onClick={() => openEditModal(app)} className="text-[10px] font-black uppercase tracking-widest">
                                  <Pencil className="mr-2 h-3.5 w-3.5" /> EDIT
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest">
                                  <ExternalLink className="mr-2 h-3.5 w-3.5" /> DETAILS
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                                <DropdownMenuItem 
                                  onClick={() => openDeleteModal(app)}
                                  className="text-[10px] font-black uppercase tracking-widest text-red-500"
                                >
                                  <Trash2 className="mr-2 h-3.5 w-3.5" /> DELETE
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                <MapPin className="h-3 w-3" /> {app.location || 'Remote'}
                              </div>
                              <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                <Calendar className="h-3 w-3" /> {new Date(app.applied_date!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </div>
                            </div>

                            {/* Match Score Circle */}
                            {(() => {
                              const localScore = localStorage.getItem(`match_score_${app.id}`) || (app as any).match_score
                              if (localScore) {
                                const score = parseInt(localScore.toString())
                                return (
                                  <div className="relative h-10 w-10 shrink-0">
                                    <svg className="h-full w-full -rotate-90">
                                      <circle cx="20" cy="20" r="16" fill="none" stroke="#27272a" strokeWidth="3" className="stroke-zinc-200 dark:stroke-zinc-800" />
                                      <motion.circle
                                        cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3"
                                        className="text-cyan-500 dark:text-[#22d3ee]"
                                        strokeDasharray="100.53"
                                        initial={{ strokeDashoffset: 100.53 }}
                                        animate={{ strokeDashoffset: 100.53 - (100.53 * score) / 100 }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-cyan-600 dark:text-[#22d3ee]">
                                      {score}
                                    </div>
                                  </div>
                                )
                              }
                              return (
                                <Badge variant="outline" className="text-[8px] font-black border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter">
                                  NO SCORE
                                </Badge>
                              )
                            })()}
                          </div>

                          {/* Quick Actions (Move Status) */}
                          <div className="flex gap-1 pt-2">
                            {columns.filter(c => c.id !== app.status).map(c => (
                              <Button
                                key={c.id}
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(app.id!, c.id)}
                                className="h-6 flex-1 text-[8px] font-black border-zinc-200 dark:border-zinc-800 hover:border-cyan-500/50 dark:hover:border-[#22d3ee]/50 text-zinc-400 dark:text-zinc-500 hover:text-cyan-600 dark:hover:text-[#22d3ee] uppercase tracking-tighter transition-all"
                              >
                                TO {c.label}
                              </Button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {columnApps.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 opacity-20 group-hover:opacity-40 transition-opacity">
                    <Building2 className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">Empty Column</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add/Edit Modal */}
      <Dialog
        open={isAddModalOpen || isEditModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddModalOpen(false)
            setIsEditModalOpen(false)
            setSelectedApplication(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-widest text-cyan-600 dark:text-[#22d3ee]">
              {isEditModalOpen ? "Modify Application" : "Initiate New Pipeline"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Corporation</Label>
              <Input
                placeholder="E.G. NVIDIA, SPACEX, OPENAI..."
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="bg-zinc-50 dark:bg-black border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-100 focus-visible:ring-cyan-500 dark:focus-visible:ring-[#22d3ee] rounded-xl h-11 uppercase"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Strategic Role</Label>
              <Input
                placeholder="E.G. QUANTUM ENGINEER, AI ARCHITECT..."
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="bg-zinc-50 dark:bg-black border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-100 focus-visible:ring-cyan-500 dark:focus-visible:ring-[#22d3ee] rounded-xl h-11 uppercase"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">HQ Location</Label>
                <Input
                  placeholder="REMOTE / GLOBAL..."
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="bg-zinc-50 dark:bg-black border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-100 h-11 rounded-xl uppercase"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Compensation</Label>
                <Input
                  placeholder="CONTRACT / ANNUAL..."
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  className="bg-zinc-50 dark:bg-black border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-100 h-11 rounded-xl uppercase"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pipeline Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as ApplicationStatus })}
                >
                  <SelectTrigger className="bg-zinc-50 dark:bg-black border-zinc-200 dark:border-zinc-800 h-11 rounded-xl uppercase font-black text-[10px] tracking-widest">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-[10px] font-black uppercase tracking-widest">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Match Score (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0 - 100"
                  value={formData.match_score || ""}
                  onChange={(e) => setFormData({ ...formData, match_score: parseInt(e.target.value) || 0 })}
                  className="bg-zinc-50 dark:bg-black border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-100 h-11 rounded-xl"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setIsAddModalOpen(false)
                setIsEditModalOpen(false)
                resetForm()
              }}
              className="text-[10px] font-black uppercase tracking-widest"
            >
              Cancel
            </Button>
            <Button
              onClick={isEditModalOpen ? handleEditApplication : handleAddApplication}
              disabled={!formData.company || !formData.role}
              className="bg-cyan-500 dark:bg-[#22d3ee] text-white dark:text-zinc-950 font-black uppercase tracking-widest px-8 rounded-xl"
            >
              {isEditModalOpen ? "Commit Changes" : "Deploy Pipeline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-cyan-600 dark:text-[#22d3ee] font-black uppercase tracking-widest">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest pt-2">
              Permanently remove <span className="text-zinc-900 dark:text-white italic">{selectedApplication?.company}</span> from tracker?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest" onClick={() => setIsDeleteModalOpen(false)}>
              Abort
            </Button>
            <Button variant="destructive" className="font-black uppercase tracking-widest px-8" onClick={handleDeleteApplication}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
