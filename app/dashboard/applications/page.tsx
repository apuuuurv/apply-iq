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
  DollarSign,
  ExternalLink,
} from "lucide-react"
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
  const [formData, setFormData] = useState({
    company: "",
    role: "",
    location: "",
    salary: "",
    notes: "",
    status: "applied" as ApplicationStatus,
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
      await createJobApplication({
        company: formData.company,
        role: formData.role,
        location: formData.location,
        salary: formData.salary,
        notes: formData.notes,
        status: formData.status,
      })
      setIsAddModalOpen(false)
      resetForm()
      toast.success("Application added successfully!")
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
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading applications...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Applications
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track and manage your job applications
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Application
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by company or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Applications Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredApplications.map((application, index) => (
            <motion.div
              key={application.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              layout
            >
              <Card className="group relative overflow-hidden transition-all hover:shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-lg font-semibold">
                        {application.company.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">
                          {application.company}
                        </h3>
                        <p className="truncate text-sm text-muted-foreground">
                          {application.role}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openEditModal(application)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => openDeleteModal(application)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">{application.location}</span>
                    </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>
                          Applied{" "}
                          {new Date(application.applied_date || new Date().toISOString()).toLocaleDateString()}
                        </span>
                      </div>
                    {application.salary && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4 shrink-0" />
                        <span className="truncate">{application.salary}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <Badge
                      variant="secondary"
                      className={statusColors[application.status as ApplicationStatus]}
                    >
                      {application.status.charAt(0).toUpperCase() +
                        application.status.slice(1)}
                    </Badge>
                    {application.notes && (
                      <span className="text-xs text-muted-foreground">
                        Has notes
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredApplications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No applications found</h3>
          <p className="mt-1 text-muted-foreground">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your filters"
              : "Start by adding your first job application"}
          </p>
          {!searchQuery && statusFilter === "all" && (
            <Button className="mt-4" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Application
            </Button>
          )}
        </div>
      )}

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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditModalOpen ? "Edit Application" : "Add New Application"}
            </DialogTitle>
            <DialogDescription>
              {isEditModalOpen
                ? "Update the details of your job application."
                : "Add a new job application to track."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                placeholder="e.g., Google"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                placeholder="e.g., Senior Frontend Engineer"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., San Francisco, CA"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="salary">Salary Range</Label>
                <Input
                  id="salary"
                  placeholder="e.g., $150k - $200k"
                  value={formData.salary}
                  onChange={(e) =>
                    setFormData({ ...formData, salary: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    status: value as ApplicationStatus,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this application..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false)
                setIsEditModalOpen(false)
                setSelectedApplication(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={isEditModalOpen ? handleEditApplication : handleAddApplication}
              disabled={!formData.company || !formData.role}
            >
              {isEditModalOpen ? "Save Changes" : "Add Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your application to{" "}
              <span className="font-medium">{selectedApplication?.company}</span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteApplication}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
