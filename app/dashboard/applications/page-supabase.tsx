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

  const getStatusDisplay = (status: string) => {
    return statusOptions.find((opt) => opt.value === status)?.label || status
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground mt-2">
            Manage your job applications and track their progress
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setIsAddModalOpen(true)
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Application
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by company or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No applications found</p>
              <p className="text-sm text-muted-foreground">
                {applications.length === 0
                  ? "Start by adding your first application"
                  : "Try adjusting your search or filters"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            {filteredApplications.map((application, index) => (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-semibold">
                            {application.company}
                          </h3>
                          <Badge
                            className={statusColors[
                              application.status as ApplicationStatus
                            ]}
                          >
                            {getStatusDisplay(application.status)}
                          </Badge>
                        </div>

                        <p className="text-muted-foreground mb-4">
                          {application.role}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          {application.location && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>{application.location}</span>
                            </div>
                          )}
                          {application.salary && (
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              <span>{application.salary}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {new Date(application.applied_date || new Date().toISOString()).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {application.notes && (
                          <p className="text-sm text-muted-foreground">
                            {application.notes}
                          </p>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditModal(application)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedApplication(application)
                              setIsDeleteModalOpen(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddModalOpen(false)
          setIsEditModalOpen(false)
          setSelectedApplication(null)
          resetForm()
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditModalOpen ? "Edit Application" : "Add New Application"}
            </DialogTitle>
            <DialogDescription>
              {isEditModalOpen
                ? "Update the application details"
                : "Add a new job application to track"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company Name *</Label>
              <Input
                id="company"
                placeholder="e.g., Google"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Job Title *</Label>
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
              <div className="space-y-2">
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

              <div className="space-y-2">
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

            <div className="space-y-2">
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
                <SelectTrigger id="status">
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

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this application..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (isAddModalOpen) setIsAddModalOpen(false)
                if (isEditModalOpen) setIsEditModalOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={
                isEditModalOpen
                  ? handleEditApplication
                  : handleAddApplication
              }
            >
              {isEditModalOpen ? "Update" : "Add"} Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this application? This action
              cannot be undone.
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
