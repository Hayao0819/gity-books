"use client"

import { useState, useEffect } from "react"
import { supabase, isMockMode } from "@/lib/supabase"

export interface Book {
  id: string
  title: string
  author: string
  isbn: string
  publisher?: string
  published_year?: number
  description?: string
  status: "available" | "borrowed"
  borrowedBy?: string
  dueDate?: string
}

// モックデータ
const mockBooks: Book[] = [
  {
    id: "1",
    title: "JavaScript入門",
    author: "田中太郎",
    isbn: "978-4-123456-78-9",
    status: "available",
  },
  {
    id: "2",
    title: "React実践ガイド",
    author: "佐藤花子",
    isbn: "978-4-987654-32-1",
    status: "borrowed",
    borrowedBy: "山田次郎",
    dueDate: "2024-01-15",
  },
  {
    id: "3",
    title: "Go言語プログラミング",
    author: "鈴木一郎",
    isbn: "978-4-555666-77-8",
    status: "available",
  },
  {
    id: "4",
    title: "データベース設計",
    author: "高橋美咲",
    isbn: "978-4-111222-33-4",
    status: "borrowed",
    borrowedBy: "田中三郎",
    dueDate: "2024-01-20",
  },
]

export function useBooks(search = "") {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBooks() {
      try {
        setLoading(true)
        setError(null)

        // モックモードまたはSupabaseが利用できない場合
        if (isMockMode || !supabase) {
          console.log("Using mock data for books")

          // 検索フィルタリング
          let filteredBooks = mockBooks
          if (search) {
            filteredBooks = mockBooks.filter(
              (book) =>
                book.title.toLowerCase().includes(search.toLowerCase()) ||
                book.author.toLowerCase().includes(search.toLowerCase()) ||
                book.isbn.includes(search),
            )
          }

          // 少し遅延を追加してローディング状態を見せる
          await new Promise((resolve) => setTimeout(resolve, 500))
          setBooks(filteredBooks)
          return
        }

        let query = supabase.from("books").select("*")

        if (search) {
          query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%,isbn.ilike.%${search}%`)
        }

        const { data, error: supabaseError } = await query

        if (supabaseError) {
          throw supabaseError
        }

        // データがない場合はモックデータを使用
        if (!data || data.length === 0) {
          console.log("No data from Supabase, using mock data")
          setBooks(mockBooks)
        } else {
          setBooks(data as Book[])
        }
      } catch (err) {
        console.error("Error fetching books:", err)
        setError(err instanceof Error ? err.message : "Unknown error")

        // エラー時もモックデータを使用
        console.log("Error occurred, falling back to mock data")
        setBooks(mockBooks)
      } finally {
        setLoading(false)
      }
    }

    fetchBooks()
  }, [search])

  return { books, loading, error }
}
