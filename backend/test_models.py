import sys
import os
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models import Note, User

db = SessionLocal()
try:
    first_user = db.query(User).first()
    if not first_user:
        print("No users found in database.")
    else:
        print(f"Found user: {first_user.email} (ID: {first_user.id})")
        # Check if notes table exists by query it
        notes_count = db.query(Note).count()
        print(f"Notes table exists and contains {notes_count} notes.")
except Exception as e:
    print(f"Model test failed: {e}")
finally:
    db.close()
