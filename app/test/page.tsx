"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestPage() {
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkHealth = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/health")
      const data = await response.json()
      setHealthStatus(data)
    } catch (error) {
      setHealthStatus({ error: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>システムテスト</CardTitle>
          <CardDescription>アプリケーションの動作確認</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={checkHealth} disabled={loading}>
            {loading ? "確認中..." : "ヘルスチェック"}
          </Button>

          {healthStatus && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">結果:</h3>
              <pre className="bg-muted p-4 rounded text-sm overflow-auto">{JSON.stringify(healthStatus, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
