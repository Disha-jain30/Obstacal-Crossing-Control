// File: /app/api/lane-overview/route.ts
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

    // Get most recent position of each vehicle
    const [vehicles] = await connection.execute(`
      SELECT l.rfid, l.cpid, l.timestamp, c.lane, vd.Type_of_Veh
      FROM logs l
      JOIN (
        SELECT rfid, MAX(timestamp) as max_time
        FROM logs
        GROUP BY rfid
      ) latest ON l.rfid = latest.rfid AND l.timestamp = latest.max_time
      JOIN checkpoints c ON l.cpid = c.cpid
      JOIN Vehicle_Details vd ON l.rfid = vd.rfid
    `)

    // Group by lane
    const grouped = {}
    for (const row of vehicles) {
      const lane = row.lane
      if (!grouped[lane]) {
        grouped[lane] = []
      }

      grouped[lane].push({
        id: row.rfid,
        checkpoint: parseInt(row.cpid.replace(/[^\d]/g, "")), // extract number
        category: row.Type_of_Veh,
        speed: Math.floor(Math.random() * 20 + 40), // Optional: fake speed for visual
      })
    }

    const laneData = Object.entries(grouped).map(([lane, vehicles]) => ({
      id: lane,
      name: `Lane ${lane.replace("L", "")}`,
      status: "active",
      vehicles,
    }))

    return NextResponse.json({ lanes: laneData })
  } catch (err: any) {
    console.error("Lane overview API error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  } finally {
    if (connection) await connection.end()
  }
}
