// File: /app/api/live/route.ts

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

    // ✅ 1. Current vehicle positions (latest log for each RFID)
    const [currentPositions] = await connection.execute(`
      SELECT 
        l.rfid,
        vd.Type_of_Veh,
        vd.BA_NO,
        vd.Unit,
        vd.Formation,
        vd.Purpose,
        l.cpid,
        c.lane,
        l.timestamp
      FROM logs l
      JOIN (
        SELECT rfid, MAX(timestamp) AS max_time
        FROM logs
        GROUP BY rfid
      ) latest ON l.rfid = latest.rfid AND l.timestamp = latest.max_time
      JOIN checkpoints c ON l.cpid = c.cpid
      JOIN vehicle_details vd ON vd.rfid = l.rfid
      ORDER BY l.timestamp DESC
    `)

    // ✅ 2. Recent activity: last 20 logs
    const [recentActivity] = await connection.execute(`
      SELECT 
        l.rfid,
        l.cpid,
        l.timestamp,
        vd.Type_of_Veh,
        vd.BA_NO,
        vd.Unit,
        vd.Formation,
        vd.Purpose,
        c.lane
      FROM logs l
      JOIN vehicle_details vd ON l.rfid = vd.rfid
      JOIN checkpoints c ON l.cpid = c.cpid
      ORDER BY l.timestamp DESC
      LIMIT 20
    `)

    // ✅ 3. Lane status: active vehicles and last activity in each lane
    const [laneStatus] = await connection.execute(`
      SELECT 
        c.lane,
        COUNT(DISTINCT l.rfid) as active_vehicles,
        MAX(l.timestamp) as last_activity
      FROM logs l
      JOIN checkpoints c ON l.cpid = c.cpid
      WHERE l.timestamp >= NOW() - INTERVAL 1 HOUR
      GROUP BY c.lane
    `)

    return NextResponse.json({
      success: true,
      currentPositions,
      recentActivity,
      laneStatus,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Live tracking DB error:", error)
    return NextResponse.json({
      error: "Failed to fetch live tracking data",
      details: error.message,
    }, { status: 500 })
  } finally {
    if (connection) await connection.end()
  }
}
