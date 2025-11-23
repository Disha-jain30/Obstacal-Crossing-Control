import mysql.connector
from mysql.connector import Error

def create_database_and_tables():
    """
    Create the occo_db database and required tables
    This replicates the database structure used in your Python scripts
    """
    try:
        # Connect to MySQL server (without specifying database)
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='Shourya16'
        )
        
        cursor = connection.cursor()
        
        # Create database if it doesn't exist
        cursor.execute("CREATE DATABASE IF NOT EXISTS occo_db")
        cursor.execute("USE occo_db")
        
        # Create checkpoints table
        create_checkpoints_table = """
        CREATE TABLE IF NOT EXISTS checkpoints (
            cpid VARCHAR(30) PRIMARY KEY,
            lane VARCHAR(5)
        )
        """
        
        # Create Vehicle_Details table
        create_vehicle_details_table = """
        CREATE TABLE IF NOT EXISTS Vehicle_Details (
            sno INT,
            rfid VARCHAR(30) PRIMARY KEY,
            BA_NO VARCHAR(30),
            Type_of_Veh VARCHAR(5) DEFAULT "B",
            Unit VARCHAR(20),
            Formation VARCHAR(20),
            Lane VARCHAR(5),
            No_of_Trps INT,
            Purpose VARCHAR(30)
        )
        """
        
        # Create logs table
        create_logs_table = """
        CREATE TABLE IF NOT EXISTS logs (
            log_id INTEGER PRIMARY KEY AUTO_INCREMENT,
            rfid VARCHAR(30),
            cpid VARCHAR(30),
            timestamp DATETIME,
            FOREIGN KEY (rfid) REFERENCES Vehicle_Details(rfid),
            FOREIGN KEY (cpid) REFERENCES checkpoints(cpid)
        )
        """
        
        # Create dummy_logs table
        create_dummy_logs_table = """
        CREATE TABLE IF NOT EXISTS dummy_logs (
            log_id INTEGER PRIMARY KEY AUTO_INCREMENT,
            rfid VARCHAR(30),
            cpid VARCHAR(30),
            timestamp DATETIME,
            FOREIGN KEY (rfid) REFERENCES Vehicle_Details(rfid),
            FOREIGN KEY (cpid) REFERENCES checkpoints(cpid)
        )
        """
        
        # Execute table creation
        cursor.execute(create_checkpoints_table)
        cursor.execute(create_vehicle_details_table)
        cursor.execute(create_logs_table)
        cursor.execute(create_dummy_logs_table)
        
        # Insert checkpoint data
        lanes = ["L1", "L2", "L3", "L4"]
        for lane in lanes:
            for cp_num in range(1, 11):  # CP1 to CP10
                cpid = f"{lane}_CP{cp_num}"
                insert_checkpoint = """
                INSERT IGNORE INTO checkpoints (cpid, lane) 
                VALUES (%s, %s)
                """
                cursor.execute(insert_checkpoint, (cpid, lane))
        
        # Insert sample vehicle data
        sample_vehicles = [
            (1, "RFID001", "BA001", "A", "Unit1", "Formation1", "L1", 5, "Training"),
            (2, "RFID002", "BA002", "B", "Unit2", "Formation2", "L2", 3, "Patrol"),
            (3, "RFID003", "BA003", "A", "Unit3", "Formation3", "L3", 7, "Exercise"),
            (4, "RFID004", "BA004", "B", "Unit4", "Formation4", "L4", 4, "Transport"),
            (5, "RFID005", "BA005", "A", "Unit1", "Formation1", "L1", 6, "Training"),
        ]
        
        for vehicle in sample_vehicles:
            insert_vehicle = """
            INSERT IGNORE INTO Vehicle_Details 
            (sno, rfid, BA_NO, Type_of_Veh, Unit, Formation, Lane, No_of_Trps, Purpose) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_vehicle, vehicle)
        
        connection.commit()
        print("✅ Database and tables created successfully!")
        print("✅ Checkpoint data inserted!")
        print("✅ Sample vehicle data inserted!")
        
        # Show table info
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print(f"📊 Tables created: {[table[0] for table in tables]}")
        
    except Error as e:
        print(f"❌ Error: {e}")
    
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    create_database_and_tables()
