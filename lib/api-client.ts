/**
 * API Client for Resume Analyzer Backend
 * 
 * Handles all communication with the FastAPI backend
 * Base URL: http://localhost:8000 (development)
 * 
 * Endpoints:
 * - POST /analyze: Analyze resume against job description
 * - GET /health: Health check
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface AnalysisResponse {
  match_score: number
  resume_skills: string[]
  jd_skills: string[]
  missing_skills: string[]
  error?: string
}

/**
 * Analyze a resume against a job description
 * 
 * @param file - Resume file (PDF or DOCX)
 * @param jobDescription - Job description text (min 50 characters)
 * @returns Analysis results with match score and skills breakdown
 */
export async function analyzeResume(
  file: File,
  jobDescription: string
): Promise<AnalysisResponse> {
  try {
    // Validate inputs
    if (!file) {
      throw new Error("No file provided")
    }

    if (!jobDescription || jobDescription.trim().length < 50) {
      throw new Error("Job description must be at least 50 characters")
    }

    // Check file type
    const fileExt = file.name.toLowerCase().split(".").pop()
    if (!["pdf", "docx", "doc"].includes(fileExt || "")) {
      throw new Error("Unsupported file format. Please use PDF or DOCX.")
    }

    // Create FormData for multipart request
    const formData = new FormData()
    formData.append("file", file)
    formData.append("job_description", jobDescription.trim())

    // Send request to backend
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: "POST",
      body: formData,
      // Note: Don't set Content-Type header, browser will set it with boundary
    })

    // Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage =
        errorData.detail ||
        errorData.error ||
        `Server error: ${response.status}`
      throw new Error(errorMessage)
    }

    const result: AnalysisResponse = await response.json()
    return result
  } catch (error) {
    console.error("Resume analysis error:", error)
    throw error
  }
}

/**
 * Check if backend is running
 * 
 * @returns Health status
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
    })
    return response.ok
  } catch (error) {
    console.error("Health check failed:", error)
    return false
  }
}
