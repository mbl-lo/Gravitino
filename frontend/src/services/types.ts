// Типы для API запросов и ответов

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  token: string
  user: User
}

export interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'user' | 'manager'
  company: string
  avatar?: string
}

export interface ApiError {
  message: string
  status: number
  errors?: Record<string, string[]>
}

export interface Waybill {
  id: number
  number: string
  date: string
  driver: string
  car_number: string
  status: 'pending' | 'approved' | 'rejected'
  distance: number
  fuel_consumption: number
}