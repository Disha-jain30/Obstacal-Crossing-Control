// File: /app/api/simulate/route.ts

import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"

const db = {
  host: "localhost",
  user: "root",
  password: "Shourya16",
  database: "occo_db",
}

export async function POST(req: NextRequest) {
  let connection
  try {
    const { rfid } = await req.json()

    if (!rfid) {
      return NextResponse.json({ error: "Missing RFID" }, { status: 400 })
    }

    connection = await mysql.createConnection(db)

    // ✅ 1. Fetch vehicle info from vehicle_details
    const [rows] = await connection.execute(
      `SELECT rfid, Type_of_Veh, Lane FROM vehicle_details WHERE rfid = ?`,
      [rfid]
    )

    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: "RFID not found in vehicle_details" }, { status: 404 })
    }

    const vehicle = (rows as any)[0]
    const category = vehicle.Type_of_Veh
    const lane = vehicle.Lane

    // ✅ 2. Get latest checkpoint the vehicle passed (from logs)
    const [latestLog] = await connection.execute(
      `SELECT cpid FROM logs WHERE rfid = ? ORDER BY timestamp DESC LIMIT 1`,
      [rfid]
    )

    let currentCp = 0
    if ((latestLog as any[]).length > 0) {
      const lastCpid = (latestLog as any)[0].cpid
      const cpMatch = lastCpid.match(/CP(\d+)/)
      currentCp = cpMatch ? parseInt(cpMatch[1]) : 0
    }

    // ✅ 3. Check if already completed
    if (currentCp >= 10) {
      return NextResponse.json({
        success: true,
        message: "Vehicle has completed all checkpoints",
        rfid,
        lane,
        status: "completed",
      })
    }

    const nextCp = currentCp + 1
    const nextCpid = `${lane}CP${nextCp}`

    // ✅ 4. Simulate delay
    const delayMin = category === "A" ? Math.floor(Math.random() * 3) + 4 : Math.floor(Math.random() * 3) + 1
    const delaySec = Math.floor(Math.random() * 60)
    const timestamp = new Date()
    timestamp.setMinutes(timestamp.getMinutes() + delayMin)
    timestamp.setSeconds(timestamp.getSeconds() + delaySec)

    const formattedTs = timestamp.toISOString().slice(0, 19).replace("T", " ")

    // ✅ 5. Insert into logs
    await connection.execute(
      `INSERT INTO logs (rfid, cpid, timestamp) VALUES (?, ?, ?)`,
      [rfid, nextCpid, formattedTs]
    )

    return NextResponse.json({
      success: true,
      message: `Vehicle ${rfid} moved to ${nextCpid}`,
      lane,
      currentCheckpoint: nextCp,
      timestamp: formattedTs,
      delayMinutes: delayMin,
    })
  } catch (err: any) {
    console.error("Simulation error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  } finally {
    if (connection) await connection.end()
  }
}
