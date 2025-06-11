"use client"

import { useState, useEffect } from "react"
import { supabase, isMockMode } from "@/lib/supabase"
import type { User, Session } from "@supabase/supabase-js"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // モックモードの場合は認証をスキップ
    if (isMockMode) {
      console.log("Running in mock mode - authentication disabled")
      setLoading(false)
      return
    }

    // 現在のセッションを取得
    const getSession = async () => {
      try {
        setLoading(true)
        setError(null)

        const {
          data: { session },
          error: sessionError,
        } = await supabase!.auth.getSession()

        if (sessionError) {
          console.error("Error getting session:", sessionError)
          setError(sessionError.message)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (err) {
        console.error("Unexpected error getting session:", err)
        setError("認証の初期化に失敗しました")
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // セッション変更のリスナーを設定
    const {
      data: { subscription },
    } = supabase!.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      setError(null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    if (isMockMode) {
      // モックモードでは常に成功
      const mockUser = {
        id: "mock-user-id",
        email: email,
        user_metadata: { name: "テストユーザー" },
        app_metadata: { role: "user" },
      } as User

      setUser(mockUser)
      return { success: true, data: { user: mockUser } }
    }

    try {
      const { data, error } = await supabase!.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error("Login error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "ログインに失敗しました",
      }
    }
  }

  const logout = async () => {
    if (isMockMode) {
      setUser(null)
      setSession(null)
      return { success: true }
    }

    try {
      const { error } = await supabase!.auth.signOut()

      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error("Logout error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "ログアウトに失敗しました",
      }
    }
  }

  return {
    user,
    session,
    loading,
    error,
    login,
    logout,
    isMockMode,
  }
}
