// File: /app/api/upload-excel/route.ts

import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const excelFile = formData.get("excelFile") as File

    if (!excelFile) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const buffer = await excelFile.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(worksheet)

    if (data.length === 0) {
      return NextResponse.json({ error: "Excel file is empty" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Excel preview generated",
      preview: data.slice(0, 5), // Return only top 5 rows for preview
      totalRows: data.length,
    })
  } catch (error: any) {
    console.error("Excel upload preview error:", error)
    return NextResponse.json(
      { error: "Failed to read Excel file", details: error.message },
      { status: 500 }
    )
  }
}
