"use client"

import type React from "react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const ExcelUploader = () => {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      console.log("📁 File selected:", e.target.files[0]) // 🔍
    } else {
      setFile(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setUploadStatus("idle")

    const formData = new FormData()
    formData.append("file", file) // Flask expects this key

    console.log("📤 Uploading file to Flask:", file.name) // 🔍

    try {
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      console.log("✅ Flask response:", data) // 🔍

      if (response.ok) {
        setUploadStatus("success")
        toast({
          title: "Upload Successful",
          description: data.message || `File ${file.name} uploaded.`,
        })

        // Optional: let other components know
        const event = new CustomEvent("excel-data-uploaded", {
          detail: data,
        })
        window.dispatchEvent(event)
      } else {
        setUploadStatus("error")
        toast({
          title: "Upload Failed",
          description: data.error || "Failed to process Excel file",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Upload Error:", error) // 🔍
      setUploadStatus("error")
      toast({
        title: "Upload Error",
        description: "An error occurred while uploading the file",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Upload Excel File</CardTitle>
        <CardDescription>Upload your Excel file to process data.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <Label htmlFor="excel">Excel File</Label>
          <Input type="file" id="excel" onChange={handleFileChange} />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={handleUpload} disabled={!file || isUploading}>
          {isUploading ? "Uploading..." : "Upload"}
        </Button>
        {isUploading && <Progress value={null} />}
        {uploadStatus === "success" && <div>Upload Successful!</div>}
        {uploadStatus === "error" && <div>Upload Failed.</div>}
      </CardFooter>
    </Card>
  )
}

export default ExcelUploader
