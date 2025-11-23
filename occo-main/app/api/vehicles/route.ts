// File: /app/api/vehicles/route.ts

import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"

const db = {
  host: "localhost",
  user: "root",
  password: "Shourya16",
  database: "occo_db",
}

export async function GET(request: NextRequest) {
  let connection
  try {
    connection = await mysql.createConnection(db)

    // ✅ Latest log per vehicle with checkpoint and lane
    const [vehicles] = await connection.execute(`
      SELECT 
        vd.rfid,
        vd.BA_NO,
        vd.Type_of_Veh,
        vd.Unit,
        vd.Formation,
        vd.Lane,
        vd.No_of_Trps,
        vd.Purpose,
        l.cpid,
        l.timestamp,
        c.lane
      FROM vehicle_details vd
      LEFT JOIN (
        SELECT rfid, cpid, timestamp
        FROM logs l1
        WHERE timestamp = (
          SELECT MAX(timestamp)
          FROM logs l2
          WHERE l1.rfid = l2.rfid
        )
      ) l ON vd.rfid = l.rfid
      LEFT JOIN checkpoints c ON l.cpid = c.cpid
      ORDER BY l.timestamp DESC
    `)

    // ✅ Vehicle count per lane
    const [laneStats] = await connection.execute(`
      SELECT c.lane, COUNT(DISTINCT l.rfid) AS vehicle_count
      FROM logs l
      JOIN checkpoints c ON l.cpid = c.cpid
      GROUP BY c.lane
    `)

    // ✅ Type distribution
    const [categoryStats] = await connection.execute(`
      SELECT Type_of_Veh, COUNT(*) AS count
      FROM vehicle_details
      GROUP BY Type_of_Veh
    `)

    return NextResponse.json({
      success: true,
      vehicles,
      laneStats,
      categoryStats,
    })
  } catch (error: any) {
    console.error("GET /vehicles error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    if (connection) await connection.end()
  }
}

export async function POST(request: NextRequest) {
  let connection
  try {
    const { rfid, cpid } = await request.json()

    if (!rfid || !cpid) {
      return NextResponse.json({ error: "RFID and CPID required" }, { status: 400 })
    }

    connection = await mysql.createConnection(db)

    // ✅ Check RFID exists
    const [rfidCheck] = await connection.execute(
      "SELECT 1 FROM vehicle_details WHERE rfid = ?",
      [rfid]
    )
    if ((rfidCheck as any[]).length === 0) {
      return NextResponse.json({ error: "Invalid RFID" }, { status: 404 })
    }

    // ✅ Check CPID exists
    const [cpidCheck] = await connection.execute(
      "SELECT 1 FROM checkpoints WHERE cpid = ?",
      [cpid]
    )
    if ((cpidCheck as any[]).length === 0) {
      return NextResponse.json({ error: "Invalid CPID" }, { status: 404 })
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ")

    // ✅ Insert into logs
    await connection.execute(
      "INSERT INTO logs (rfid, cpid, timestamp) VALUES (?, ?, ?)",
      [rfid, cpid, timestamp]
    )

    // ✅ Insert into dummy_logs if CP10 not present
    const [hasCP10] = await connection.execute(
      "SELECT 1 FROM logs WHERE rfid = ? AND cpid LIKE '%CP10%'",
      [rfid]
    )

    if ((hasCP10 as any[]).length === 0) {
      await connection.execute(
        "INSERT INTO dummy_logs (rfid, cpid, timestamp) VALUES (?, ?, ?)",
        [rfid, cpid, timestamp]
      )
    }

    return NextResponse.json({
      success: true,
      message: `RFID ${rfid} logged at ${cpid}`,
      timestamp,
    })
  } catch (error: any) {
    console.error("POST /vehicles error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    if (connection) await connection.end()
  }
}
