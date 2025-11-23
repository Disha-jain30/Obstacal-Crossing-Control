// File: /app/api/analytics/route.ts

import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "Shourya16",
  database: "occo_db",
}

async function createConnection() {
  const connection = await mysql.createConnection(dbConfig)
  return connection
}

export async function GET(request: NextRequest) {
  let connection
  try {
    connection = await createConnection()

    // Vehicle count per lane
    const [laneData] = await connection.execute(`
      SELECT c.lane, COUNT(DISTINCT l.rfid) AS vehicle_count
      FROM logs l
      JOIN checkpoints c ON l.cpid = c.cpid
      GROUP BY c.lane
    `)

    const totalVehicles = laneData.reduce((sum: any, row: any) => sum + row.vehicle_count, 0)
    const laneDistribution = laneData.map((row: any) => ({
      lane: row.lane,
      vehicleCount: row.vehicle_count,
      percentage: totalVehicles > 0 ? Math.round((row.vehicle_count / totalVehicles) * 100) : 0,
    }))

    // Checkpoint-wise per-lane data
    const [lanes] = await connection.execute(`SELECT DISTINCT lane FROM checkpoints ORDER BY lane`)
    const checkpointData = []

    for (let cp = 1; cp <= 10; cp++) {
      const row: any = { checkpoint: `CP${cp}` }

      for (const lane of lanes as any) {
        const [count] = await connection.execute(
          `
          SELECT COUNT(DISTINCT l.rfid) AS vehicle_count
          FROM logs l
          JOIN checkpoints c ON l.cpid = c.cpid
          WHERE c.lane = ? AND c.cpid LIKE ?
        `,
          [lane.lane, `${lane.lane}CP${cp}`],
        )
        row[lane.lane] = count[0]?.vehicle_count || 0
      }

      checkpointData.push(row)
    }

    // Category (Type_of_Veh) distribution
    const [categoryData] = await connection.execute(`
      SELECT Type_of_Veh, COUNT(*) AS count FROM vehicle_details GROUP BY Type_of_Veh
    `)
    const totalCategories = categoryData.reduce((sum: any, row: any) => sum + row.count, 0)
    const categoryDistribution = categoryData.map((row: any) => ({
      category: row.Type_of_Veh,
      count: row.count,
      percentage: totalCategories > 0 ? Math.round((row.count / totalCategories) * 100) : 0,
    }))

    // Latest 50 logs with details
    const [recentLogs] = await connection.execute(`
      SELECT l.rfid, l.cpid, l.timestamp, v.Type_of_Veh, v.BA_NO, v.Unit, c.lane
      FROM logs l
      JOIN vehicle_details v ON l.rfid = v.rfid
      JOIN checkpoints c ON l.cpid = c.cpid
      ORDER BY l.timestamp DESC
      LIMIT 50
    `)

    return NextResponse.json({
      success: true,
      laneDistribution,
      checkpointData,
      categoryDistribution,
      recentLogs,
      isPreview: false,
    })
  } catch (error: any) {
    console.error("Error in analytics:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  } finally {
    if (connection) await connection.end()
  }
}
