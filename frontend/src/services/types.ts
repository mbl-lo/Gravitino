export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  user: User
}

export interface User {
  id: string
  email: string
  fullName: string
  role: string
  organizationId: string
  departmentId: string | null
}

export interface ApiError {
  statusCode: number
  message: string
  error?: string
}