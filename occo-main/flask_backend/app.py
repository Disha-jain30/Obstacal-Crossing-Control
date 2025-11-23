from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import mysql.connector
from datetime import datetime

print("🚀 Flask server is starting...")
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow frontend from localhost:3000

# ---------- DB Connection ----------
def connect_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="@dishajain12B",
        database="occo"
    )

# ---------- Upload Excel and Insert ----------
@app.route("/upload", methods=["POST"])
def upload_excel():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files['file']
        try:
            df = pd.read_excel(file)
        except Exception as e:
            return jsonify({"error": f"Failed to read Excel: {str(e)}"}), 500

        required_cols = {'rfid', 'cpid', 'timestamp'}
        if not required_cols.issubset(df.columns):
            missing = required_cols - set(df.columns)
            return jsonify({"error": f"Missing columns: {missing}"}), 400

        print("📥 Excel data read successfully.")
        print("📊 Rows to process:", len(df))

        conn = connect_db()
        cursor = conn.cursor()

        cursor.execute("SELECT rfid FROM vehicle_details")
        valid_rfids = {row[0] for row in cursor.fetchall()}

        inserted = 0
        skipped = 0
        dummy_candidates = {}

        for _, row in df.iterrows():
            try:
                rfid = str(row['rfid']).strip()
                cpid = str(row['cpid']).strip()
                timestamp = row['timestamp']

                if rfid not in valid_rfids:
                    print(f"⚠ Skipping unknown RFID: {rfid}")
                    skipped += 1
                    continue

                if isinstance(timestamp, str):
                    timestamp = pd.to_datetime(timestamp)
                timestamp = timestamp.strftime('%Y-%m-%d %H:%M:%S')

                cursor.execute(
                    "INSERT INTO logs (rfid, cpid, timestamp) VALUES (%s, %s, %s)",
                    (rfid, cpid, timestamp)
                )

                dummy_candidates.setdefault(rfid, []).append((cpid, timestamp))
                inserted += 1
                print(f"✅ Inserted log: {rfid} → {cpid} at {timestamp}")

            except Exception as e:
                print(f"❌ Error processing row for {row.get('rfid', '')}: {str(e)}")
                skipped += 1
                continue

        # Dummy logs condition
        for rfid, entries in dummy_candidates.items():
            if not any(str(cp).endswith("CP10") for cp, _ in entries):
                for cp, ts in entries:
                    cursor.execute("INSERT INTO dummy_logs (rfid, cpid, timestamp) VALUES (%s, %s, %s)", (rfid, cp, ts))

        conn.commit()
        conn.close()

        print(f"\n✅ Upload Complete — Inserted: {inserted}, Skipped: {skipped}")
        return jsonify({
            "message": f"Upload Complete",
            "inserted": inserted,
            "skipped": skipped
        })

    except Exception as e:
        print("❌ Server error:", str(e))
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

# ---------- Analytics: Pie Chart ----------
@app.route("/analytics/pie", methods=["GET"])
def pie_data():
    conn = connect_db()
    query = """
        SELECT c.lane, COUNT(*) AS vehicle_count
        FROM dummy_logs d
        JOIN checkpoints c ON d.cpid = c.cpid
        GROUP BY c.lane
    """
    df = pd.read_sql(query, conn)
    conn.close()
    return df.to_dict(orient="records")

# ---------- Analytics: Bar Chart ----------
@app.route("/analytics/bar/<lane>", methods=["GET"])
def bar_data(lane):
    conn = connect_db()
    query = """
        SELECT c.cpid, COUNT(DISTINCT l.rfid) AS vehicle_count
        FROM logs l
        JOIN checkpoints c ON l.cpid = c.cpid
        WHERE c.lane = %s
        GROUP BY c.cpid
        ORDER BY c.cpid
    """
    df = pd.read_sql(query, conn, params=(lane,))
    conn.close()
    return df.to_dict(orient="records")

# ---------- Root Route ----------
@app.route("/", methods=["GET"])
def home():
    return "✅ Flask backend is running. Use /upload or /analytics/* routes."

# ---------- Main ----------
if __name__ == "__main__":
    print("✅ Starting Flask server on port 8000...")
    app.run(host="0.0.0.0", port=8000, debug=True)
