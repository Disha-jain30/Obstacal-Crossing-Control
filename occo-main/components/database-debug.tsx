"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, Eye } from "lucide-react"

export default function DatabaseDebug() {
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchDebugData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug-data")
      const data = await response.json()
      setDebugData(data)
    } catch (error) {
      console.error("Failed to fetch debug data:", error)
    } finally {
      setLoading(false)
    }
  }

  const counts = debugData?.counts || {}
  const sample = debugData?.sampleData || {}

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Debug Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={fetchDebugData} disabled={loading}>
          <Eye className="h-4 w-4 mr-2" />
          {loading ? "Loading..." : "Check Database Contents"}
        </Button>

        {debugData && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-lg font-bold text-blue-600">{counts.vehicles ?? 0}</div>
                <div className="text-sm text-blue-800">Vehicles</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-lg font-bold text-green-600">{counts.logs ?? 0}</div>
                <div className="text-sm text-green-800">Logs</div>
              </div>
              <div className="bg-orange-50 p-3 rounded">
                <div className="text-lg font-bold text-orange-600">{counts.checkpoints ?? 0}</div>
                <div className="text-sm text-orange-800">Checkpoints</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Sample Vehicles:</h4>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(sample.vehicles ?? [], null, 2)}
              </pre>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Sample Logs:</h4>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(sample.logs ?? [], null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
