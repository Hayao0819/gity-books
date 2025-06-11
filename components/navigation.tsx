"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Book, Home, LogIn, LogOut, Plus, RotateCcw, ShoppingCart, User, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"

export function Navigation() {
  const pathname = usePathname()
  const { user, logout, loading, error, isMockMode } = useAuth()

  const navItems = [
    { href: "/", label: "ホーム", icon: Home },
    { href: "/books", label: "本一覧", icon: Book },
    { href: "/books/add", label: "本の追加", icon: Plus, requireAuth: true },
    { href: "/checkout", label: "貸出", icon: ShoppingCart, requireAuth: true },
    { href: "/return", label: "返却", icon: RotateCcw, requireAuth: true },
  ]

  const handleLogout = async () => {
    await logout()
  }

  if (loading) {
    return (
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <Book className="h-6 w-6" />
              <span className="font-bold text-xl">図書管理システム</span>
            </div>
            <div className="text-sm text-muted-foreground">読み込み中...</div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Book className="h-6 w-6" />
            <span className="font-bold text-xl">図書管理システム</span>
            {isMockMode && (
              <Badge variant="secondary" className="ml-2">
                デモモード
              </Badge>
            )}
          </Link>

          <div className="flex items-center space-x-1">
            {error && (
              <div className="flex items-center space-x-1 text-destructive mr-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs hidden sm:inline">接続エラー</span>
              </div>
            )}

            {navItems.map((item) => {
              // 認証が必要なアイテムは、ログインしていない場合は表示しない（モックモードは除く）
              if (item.requireAuth && !user && !isMockMode) {
                return null
              }

              const Icon = item.icon
              return (
                <Button key={item.href} variant={pathname === item.href ? "default" : "ghost"} size="sm" asChild>
                  <Link href={item.href} className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                </Button>
              )
            })}

            {user || isMockMode ? (
              <>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{isMockMode ? "デモユーザー" : user?.email}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center space-x-2">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">ログアウト</span>
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login" className="flex items-center space-x-2">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">ログイン</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
