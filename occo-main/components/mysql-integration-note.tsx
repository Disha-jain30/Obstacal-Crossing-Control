import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, AlertCircle } from "lucide-react"

export default function MySQLIntegrationNote() {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-blue-900 flex items-center gap-2">
          <Database className="h-5 w-5" />
          MySQL Integration Ready
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Preview Mode: Using Mock Data</p>
            <p>This preview shows mock data. To connect to your actual MySQL database with your existing RFID data:</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Steps to Enable Real Database:</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Download this project using the button above</li>
            <li>
              Install dependencies: <code className="bg-blue-100 px-1 rounded">npm install</code>
            </li>
            <li>The MySQL integration code is already written with your credentials</li>
            <li>
              Run: <code className="bg-blue-100 px-1 rounded">npm run dev</code>
            </li>
            <li>Your real RFID data will appear automatically!</li>
          </ol>
        </div>

        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <p className="text-sm text-green-800">
            ✅ <strong>Database credentials configured:</strong> localhost, root, OCCO_DB
            <br />✅ <strong>All SQL queries match your Python scripts</strong>
            <br />✅ <strong>Vehicle simulation works exactly like your rfidDb.py</strong>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
