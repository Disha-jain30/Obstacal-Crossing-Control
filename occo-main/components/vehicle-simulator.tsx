"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Car, Play, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SimulatedLog {
  id: string
  rfid: string
  cpid: string
  timestamp: string
  status: "logged" | "error"
}

export default function VehicleSimulator() {
  const [rfid, setRfid] = useState("")
  const [selectedCheckpoint, setSelectedCheckpoint] = useState("")
  const [simulatedLogs, setSimulatedLogs] = useState<SimulatedLog[]>([])
  const [isLogging, setIsLogging] = useState(false)
  const { toast } = useToast()

  // Generate checkpoint options
  const lanes = ["L1", "L2", "L3", "L4"]
  const checkpoints = []
  for (const lane of lanes) {
    for (let i = 1; i <= 10; i++) {
      checkpoints.push(`${lane}_CP${i}`)
    }
  }

  const handleLogRFID = async () => {
    if (!rfid || !selectedCheckpoint) {
      toast({
        title: "Error",
        description: "Please enter RFID and select a checkpoint",
        variant: "destructive",
      })
      return
    }

    setIsLogging(true)

    try {
      // Call the real API endpoint
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rfid,
          cpid: selectedCheckpoint,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to log RFID")
      }

      // Create log entry for UI
      const newLog: SimulatedLog = {
        id: `log-${rfid}-${Date.now()}`,
        rfid: data.rfid,
        cpid: data.cpid,
        timestamp: new Date().toLocaleString(),
        status: "logged",
      }

      setSimulatedLogs((prev) => [...prev, newLog])

      toast({
        title: "RFID Logged Successfully!",
        description: `RFID ${data.rfid} logged at ${data.cpid}`,
      })

      // Reset form
      setRfid("")
      setSelectedCheckpoint("")
    } catch (error) {
      const errorLog: SimulatedLog = {
        id: `error-${rfid}-${Date.now()}`,
        rfid,
        cpid: selectedCheckpoint,
        timestamp: new Date().toLocaleString(),
        status: "error",
      }

      setSimulatedLogs((prev) => [...prev, errorLog])

      toast({
        title: "Logging Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLogging(false)
    }
  }

  const removeLog = (logId: string) => {
    setSimulatedLogs((prev) => prev.filter((log) => log.id !== logId))
  }

  const clearAll = () => {
    setSimulatedLogs([])
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Car className="h-5 w-5" />
            RFID Logger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rfid">RFID Tag</Label>
            <Input id="rfid" placeholder="e.g., RFID001" value={rfid} onChange={(e) => setRfid(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkpoint">Checkpoint</Label>
            <Select value={selectedCheckpoint} onValueChange={setSelectedCheckpoint}>
              <SelectTrigger>
                <SelectValue placeholder="Select a checkpoint" />
              </SelectTrigger>
              <SelectContent>
                {checkpoints.map((checkpoint) => (
                  <SelectItem key={checkpoint} value={checkpoint}>
                    {checkpoint}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleLogRFID} disabled={isLogging} className="w-full">
            <Play className="h-4 w-4 mr-2" />
            {isLogging ? "Logging..." : "Log RFID"}
          </Button>

          <div className="text-sm text-gray-500">
            <p>• Vehicle must exist in Vehicle_Details table</p>
            <p>• Logs are inserted into both logs and dummy_logs tables</p>
            <p>• Use this to simulate RFID tag readings</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Recent Logs ({simulatedLogs.length})</CardTitle>
          {simulatedLogs.length > 0 && (
            <Button onClick={clearAll} variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {simulatedLogs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No logs recorded</p>
            ) : (
              simulatedLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{log.rfid}</span>
                      <Badge variant="outline">{log.cpid}</Badge>
                      <Badge variant={log.status === "logged" ? "default" : "destructive"}>{log.status}</Badge>
                    </div>
                    <div className="text-xs text-gray-500">{log.timestamp}</div>
                  </div>
                  <Button onClick={() => removeLog(log.id)} variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
