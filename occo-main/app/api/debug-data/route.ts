// File: /app/api/live/route.ts

import { NextResponse } from "next/server"
import mysql from "mysql2/promise"

const db = {
  host: "localhost",
  user: "root",
  password: "Shourya16",
  database: "occo_db",
}

export async function GET() {
  let connection
  try {
    connection = await mysql.createConnection(db)

    // ✅ 1. Get most recent checkpoint for each RFID
    const [currentPositions] = await connection.execute(`
      SELECT l.rfid, l.cpid, l.timestamp, c.lane
      FROM logs l
      JOIN (
        SELECT rfid, MAX(timestamp) AS max_time
        FROM logs
        GROUP BY rfid
      ) latest ON l.rfid = latest.rfid AND l.timestamp = latest.max_time
      JOIN checkpoints c ON l.cpid = c.cpid
      ORDER BY l.timestamp DESC
    `)

    // ✅ 2. Last 20 logs across all vehicles
    const [recentActivity] = await connection.execute(`
      SELECT l.rfid, l.cpid, l.timestamp, c.lane
      FROM logs l
      JOIN checkpoints c ON l.cpid = c.cpid
      ORDER BY l.timestamp DESC
      LIMIT 20
    `)

    // ✅ 3. Count active vehicles per lane in the past 1 hour
    const [activeLanes] = await connection.execute(`
      SELECT c.lane, COUNT(DISTINCT l.rfid) AS count
      FROM logs l
      JOIN checkpoints c ON l.cpid = c.cpid
      WHERE l.timestamp >= NOW() - INTERVAL 1 HOUR
      GROUP BY c.lane
    `)

    return NextResponse.json({
      currentPositions,
      recentActivity,
      activeLanes,
      success: true,
    })
  } catch (err: any) {
    console.error("Live tracking error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  } finally {
    if (connection) await connection.end()
  }
}
