// File: /app/api/stats/route.ts

import { NextResponse } from "next/server"
import mysql from "mysql2/promise"

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "Shourya16",
  database: "occo_db",
}

export async function GET() {
  let connection

  try {
    connection = await mysql.createConnection(dbConfig)

    // ✅ Get counts from real tables
    const [[vehicleCount]] = await connection.execute("SELECT COUNT(*) as count FROM vehicle_details")
    const [[logCount]] = await connection.execute("SELECT COUNT(*) as count FROM logs")
    const [[checkpointCount]] = await connection.execute("SELECT COUNT(*) as count FROM checkpoints")

    // ✅ Get unique lanes from logs
    const [lanes] = await connection.execute(`
      SELECT DISTINCT c.lane 
      FROM logs l 
      JOIN checkpoints c ON l.cpid = c.cpid
      ORDER BY c.lane
    `)

    // ✅ Get vehicle type distribution
    const [categories] = await connection.execute(`
      SELECT Type_of_Veh, COUNT(*) as count 
      FROM vehicle_details 
      GROUP BY Type_of_Veh
    `)

    // ✅ Get recent 5 logs with vehicle details
    const [recentLogs] = await connection.execute(`
      SELECT 
        l.rfid,
        l.cpid,
        l.timestamp,
        vd.Type_of_Veh,
        vd.BA_NO
      FROM logs l
      JOIN vehicle_details vd ON l.rfid = vd.rfid
      ORDER BY l.timestamp DESC
      LIMIT 5
    `)

    return NextResponse.json({
      success: true,
      stats: {
        vehicleCount: vehicleCount.count,
        logCount: logCount.count,
        checkpointCount: checkpointCount.count,
        lanes: lanes.map((row: any) => row.lane),
        categories,
        recentLogs,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Stats route DB error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
      },
      { status: 500 }
    )
  } finally {
    if (connection) await connection.end()
  }
}
