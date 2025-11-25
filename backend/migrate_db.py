import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), 'news.db')
    print(f"Connecting to database at {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE news_items ADD COLUMN image_path VARCHAR")
        conn.commit()
        print("Migration successful: Added image_path column.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Column already exists.")
        else:
            print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
