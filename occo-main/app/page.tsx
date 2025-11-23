"use client"

import { Suspense, useState, useEffect } from "react"
import Dashboard from "@/components/dashboard"
import MySQLIntegrationNote from "@/components/mysql-integration-note"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Car, MapPin, BarChart3 } from "lucide-react"

export default function Home() {
  const [stats, setStats] = useState({
    vehicleCount: 0,
    logCount: 0,
    checkpointCount: 40,
    activeVehicles: 0,
  })
  const [isConnected, setIsConnected] = useState(false)
  const [isPreview, setIsPreview] = useState(true)

  // Fetch real-time stats from database
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/test-database")
        const data = await response.json()
        if (data.success) {
          setStats({
            vehicleCount: data.stats.vehicleCount,
            logCount: data.stats.logCount,
            checkpointCount: data.stats.checkpointCount,
            activeVehicles: data.stats.vehicleCount,
          })
          setIsConnected(true)
          setIsPreview(data.isPreview || false)
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error)
        setIsConnected(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">RFID Vehicle Tracking System</h1>
          <p className="text-gray-600 flex items-center gap-2">
            Real-time monitoring and analytics for vehicle movement across lanes and checkpoints
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-sm">
              {isPreview ? "Preview Mode (Mock Data)" : isConnected ? "Connected to Database" : "Database Disconnected"}
            </span>
          </p>
        </div>

        {isPreview && (
          <div className="mb-6">
            <MySQLIntegrationNote />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Vehicles</CardTitle>
              <Car className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.activeVehicles}</div>
              <p className="text-xs text-green-600">
                {isPreview ? "Mock data for preview" : isConnected ? "Live from database" : "Database offline"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Lanes</CardTitle>
              <MapPin className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">4</div>
              <p className="text-xs text-blue-600">L1, L2, L3, L4</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Logs</CardTitle>
              <Activity className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.logCount}</div>
              <p className="text-xs text-gray-500">Movement records</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Checkpoints</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.checkpointCount}</div>
              <p className="text-xs text-gray-500">10 per lane</p>
            </CardContent>
          </Card>
        </div>

        <Suspense fallback={<div>Loading dashboard...</div>}>
          <Dashboard />
        </Suspense>
      </div>
    </div>
  )
}
