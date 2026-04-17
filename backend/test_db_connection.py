import sys
import os
sys.path.append(os.getcwd())

try:
    from app.database import engine
    from sqlalchemy import text
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print(f"Database connection successful: {result.fetchone()}")
except Exception as e:
    print(f"Database connection failed: {e}")
