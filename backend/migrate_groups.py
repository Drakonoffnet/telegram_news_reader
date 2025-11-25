import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), 'news.db')
    print(f"Connecting to database at {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        # Create channel_groups table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS channel_groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR UNIQUE
            )
        """)
        print("Created channel_groups table.")

        # Create index for channel_groups name
        try:
            cursor.execute("CREATE UNIQUE INDEX ix_channel_groups_name ON channel_groups (name)")
            print("Created index on channel_groups.name")
        except sqlite3.OperationalError:
            print("Index ix_channel_groups_name already exists")

        # Add group_id to channels
        try:
            cursor.execute("ALTER TABLE channels ADD COLUMN group_id INTEGER REFERENCES channel_groups(id)")
            print("Added group_id column to channels.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("Column group_id already exists.")
            else:
                print(f"Error adding group_id: {e}")

        conn.commit()
        print("Migration successful.")
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
