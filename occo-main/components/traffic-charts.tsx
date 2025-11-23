"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"]

export default function TrafficCharts() {
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<"database" | "excel">("database")

  useEffect(() => {
    fetchAnalytics()

    const interval = setInterval(fetchAnalytics, 10000)
    window.addEventListener("excel-data-uploaded", handleExcelDataUploaded)

    return () => {
      clearInterval(interval)
      window.removeEventListener("excel-data-uploaded", handleExcelDataUploaded)
    }
  }, [])

  const fetchAnalytics = async () => {
    if (dataSource === "excel") return

    try {
      setError(null)

      const [pieRes, barL1Res, barL2Res, barL3Res] = await Promise.all([
        fetch("http://localhost:8000/analytics/pie"),
        fetch("http://localhost:8000/analytics/bar/L1"),
        fetch("http://localhost:8000/analytics/bar/L2"),
        fetch("http://localhost:8000/analytics/bar/L3"),
      ])

      const pieData = await pieRes.json()
      const l1Bar = await barL1Res.json()
      const l2Bar = await barL2Res.json()
      const l3Bar = await barL3Res.json()

      const allCheckpoints = new Set([
        ...l1Bar.map((d) => d.cpid),
        ...l2Bar.map((d) => d.cpid),
        ...l3Bar.map((d) => d.cpid),
      ])

      const checkpointData = Array.from(allCheckpoints).map((cpid) => ({
        checkpoint: cpid,
        L1: l1Bar.find((d) => d.cpid === cpid)?.vehicle_count || 0,
        L2: l2Bar.find((d) => d.cpid === cpid)?.vehicle_count || 0,
        L3: l3Bar.find((d) => d.cpid === cpid)?.vehicle_count || 0,
      }))

      const totalVehicles = pieData.reduce((sum, d) => sum + d.vehicle_count, 0)
      const laneDistribution = pieData.map((item, i) => ({
        name: item.lane,
        value: totalVehicles > 0 ? Math.round((item.vehicle_count / totalVehicles) * 100) : 0,
        vehicles: item.vehicle_count,
      }))

      const categoryDistribution = laneDistribution.map((item, i) => ({
        name: `Category ${item.name}`,
        value: item.value,
        color: COLORS[i % COLORS.length],
      }))

      setAnalyticsData({
        laneDistribution,
        categoryDistribution,
        checkpointData,
      })
    } catch (error: any) {
      console.error("Failed to fetch analytics:", error)
      setError(error.message || "Failed to connect to backend")
    } finally {
      setLoading(false)
    }
  }

  const handleExcelDataUploaded = (event: any) => {
    const excelData = event.detail
    setAnalyticsData(excelData)
    setDataSource("excel")
    setLoading(false)
    setError(null)
  }

  const switchToDatabase = () => {
    setDataSource("database")
    fetchAnalytics()
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p>Loading analytics from {dataSource === "database" ? "database" : "Excel file"}...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading analytics: {error}</p>
        <button onClick={fetchAnalytics} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">
          Retry
        </button>
      </div>
    )
  }

  if (!analyticsData) {
    return <div className="text-center py-8">No analytics data available</div>
  }

  const { laneDistribution, categoryDistribution, checkpointData } = analyticsData

  return (
    <div className="space-y-6">
      {dataSource === "excel" && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex justify-between items-center">
          <div>
            <p className="text-blue-800 font-medium">Viewing analytics from uploaded Excel file</p>
            <p className="text-sm text-blue-600">{analyticsData.recordCount || "Unknown"} records processed</p>
          </div>
          <button onClick={switchToDatabase} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Switch to Database
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lane Pie Chart */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Vehicle Distribution by Lane</CardTitle>
          </CardHeader>
          <CardContent>
            {laneDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={laneDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {laneDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <p>No lane data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Pie Chart */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Vehicle Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <p>No category data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card className="bg-white shadow-lg border-0 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Vehicles per Checkpoint</CardTitle>
          </CardHeader>
          <CardContent>
            {checkpointData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={checkpointData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="checkpoint" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="L1" fill="#3B82F6" />
                  <Bar dataKey="L2" fill="#10B981" />
                  <Bar dataKey="L3" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-gray-500">
                <p>No checkpoint data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
