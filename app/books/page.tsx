"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookCard } from "@/components/book-card"
import { useBooks } from "@/hooks/use-books"

export default function BooksPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const { books, loading } = useBooks(searchTerm)

  const handleCheckout = (bookId: string) => {
    // 実際はGoバックエンドのAPIを呼び出し
    console.log("Checkout book:", bookId)
  }

  const handleReturn = (bookId: string) => {
    // 実際はGoバックエンドのAPIを呼び出し
    console.log("Return book:", bookId)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">本一覧</h1>
        <Button asChild>
          <a href="/books/add">新しい本を追加</a>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="タイトル、著者、ISBNで検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <BookCard key={book.id} book={book} onCheckout={handleCheckout} onReturn={handleReturn} />
            ))}
          </div>

          {books.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">検索条件に一致する本が見つかりません。</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
