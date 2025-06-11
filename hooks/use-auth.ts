"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"

interface User {
  id: number
  email: string
  name: string
  role: string
  student_id?: string
  created_at: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check if token exists
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null

      if (!token) {
        setLoading(false)
        return
      }

      // Verify token with server
      const response = await apiClient.getMe()
      setUser(response.user)
    } catch (err) {
      console.error("Auth check failed:", err)
      setError("認証の確認に失敗しました")
      // Clear invalid token
      apiClient.clearToken()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setError(null)
      const response = await apiClient.login(email, password)
      // 修正: 型に合わせてユーザーオブジェクトを設定
      setUser(response.user)
      return { success: true, data: response }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "ログインに失敗しました"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const register = async (userData: {
    name: string
    email: string
    password: string
    student_id?: string
  }) => {
    try {
      setError(null)
      const response = await apiClient.register(userData)
      // 修正: 型に合わせてユーザーオブジェクトを設定
      setUser(response.user)
      return { success: true, data: response }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "登録に失敗しました"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const logout = async () => {
    try {
      await apiClient.logout()
      setUser(null)
      setError(null)
      return { success: true }
    } catch (error) {
      console.error("Logout error:", error)
      // Even if logout fails on server, clear local state
      apiClient.clearToken()
      setUser(null)
      return { success: true }
    }
  }

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    checkAuthStatus,
    isMockMode: false, // No longer using mock mode
  }
}
