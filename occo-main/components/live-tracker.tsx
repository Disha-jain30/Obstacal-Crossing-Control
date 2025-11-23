"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Car, MapPin, Clock, Search, Users, Building } from "lucide-react"

interface VehicleLog {
  id: string
  rfid: string
  lane: string
  cpid: string
  Type_of_Veh: string
  BA_NO: string
  Unit: string
  Formation: string
  Purpose: string
  timestamp: string
}

export default function LiveTracker() {
  const [logs, setLogs] = useState<VehicleLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<VehicleLog[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLane, setSelectedLane] = useState("all")
  const [isLive, setIsLive] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLiveData()
    const interval = setInterval(() => {
      if (isLive) fetchLiveData()
    }, 3000)
    return () => clearInterval(interval)
  }, [isLive])

  const fetchLiveData = async () => {
    try {
      const response = await fetch("/api/live-tracking")
      const data = await response.json()

      if (data.success) {
        const transformedLogs = data.recentActivity.map((log, index) => ({
          id: `log-${log.rfid}-${log.timestamp}-${index}`, // ✅ make key unique
          rfid: log.rfid,
          lane: log.lane,
          cpid: log.cpid,
          Type_of_Veh: log.Type_of_Veh,
          BA_NO: log.BA_NO,
          Unit: log.Unit,
          Formation: log.Formation,
          Purpose: log.Purpose,
          timestamp: new Date(log.timestamp).toLocaleString(),
        }))
        setLogs(transformedLogs)
      }
    } catch (error) {
      console.error("Failed to fetch live tracking data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = logs
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.rfid.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.BA_NO.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.Unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.cpid.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    if (selectedLane !== "all") {
      filtered = filtered.filter((log) => log.lane === selectedLane)
    }
    setFilteredLogs(filtered)
  }, [logs, searchTerm, selectedLane])

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p>Loading live tracking data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Live Vehicle Tracking
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isLive ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-sm text-gray-600">{isLive ? "Live" : "Paused"}</span>
              <Button onClick={() => setIsLive(!isLive)} variant="outline" size="sm">
                {isLive ? "Pause" : "Resume"}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by RFID, BA Number, Unit, or Checkpoint..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant={selectedLane === "all" ? "default" : "outline"} onClick={() => setSelectedLane("all")} size="sm">
                All Lanes
              </Button>
              {["L1", "L2", "L3", "L4"].map((lane) => (
                <Button key={lane} variant={selectedLane === lane ? "default" : "outline"} onClick={() => setSelectedLane(lane)} size="sm">
                  {lane}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {logs.length === 0 ? "No tracking data in database" : "No tracking data found for current filters"}
              </p>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-blue-600" />
                      <div>
                        <span className="font-medium">{log.rfid}</span>
                        <div className="text-xs text-gray-500">{log.BA_NO}</div>
                      </div>
                    </div>
                    <Badge variant="outline">{log.lane}</Badge>
                    <Badge variant="secondary">{log.cpid}</Badge>
                    <Badge variant={log.Type_of_Veh === "A" ? "default" : "destructive"}>Type {log.Type_of_Veh}</Badge>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Building className="h-3 w-3" />
                      <span>{log.Unit}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Users className="h-3 w-3" />
                      <span>{log.Formation}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="text-xs">
                      <div>{log.Purpose}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{log.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
