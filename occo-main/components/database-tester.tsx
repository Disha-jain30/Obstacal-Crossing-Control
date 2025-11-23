"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database, RefreshCw, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DatabaseStats {
  vehicleCount: number
  logCount: number
  checkpointCount: number
  lanes: string[]
  categories: { category: string; count: number }[]
  recentLogs: any[]
}

export default function DatabaseTester() {
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "failed">("unknown")
  const { toast } = useToast()

  const testConnection = async () => {
    setIsLoading(true)
    setConnectionStatus("unknown")

    try {
      const response = await fetch("/api/test-database")
      const data = await response.json()

      if (response.ok) {
        setStats(data.stats)
        setConnectionStatus("connected")
        toast({
          title: "Database Connected!",
          description: `Found ${data.stats.vehicleCount} vehicles and ${data.stats.logCount} logs`,
        })
      } else {
        setConnectionStatus("failed")
        toast({
          title: "Connection Failed",
          description: data.error || "Failed to connect to database",
          variant: "destructive",
        })
      }
    } catch (error) {
      setConnectionStatus("failed")
      toast({
        title: "Connection Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button onClick={testConnection} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Testing..." : "Test Database Connection"}
          </Button>

          {connectionStatus === "connected" && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Connected</span>
            </div>
          )}

          {connectionStatus === "failed" && (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">Failed</span>
            </div>
          )}
        </div>

        {stats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.vehicleCount}</div>
                <div className="text-sm text-blue-800">Vehicles</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.logCount}</div>
                <div className="text-sm text-green-800">Log Entries</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.checkpointCount}</div>
                <div className="text-sm text-orange-800">Checkpoints</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.lanes.length}</div>
                <div className="text-sm text-purple-800">Active Lanes</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Active Lanes:</h4>
              <div className="flex gap-2">
                {stats.lanes.map((lane) => (
                  <Badge key={lane} variant="outline">
                    {lane}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Vehicle Categories:</h4>
              <div className="flex gap-2">
                {stats.categories.map((cat) => (
                  <Badge key={cat.category} variant={cat.category === "A" ? "default" : "secondary"}>
                    Category {cat.category}: {cat.count}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Recent Activity (Last 5 logs):</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {stats.recentLogs.map((log, index) => (
                  <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                    <span className="font-medium">{log.vehicle_id}</span> →
                    <span className="text-blue-600 ml-1">{log.checkpoint_id}</span>
                    <span className="text-gray-500 ml-2">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
