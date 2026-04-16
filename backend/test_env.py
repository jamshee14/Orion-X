import sys
import os

# Add the current directory to sys.path to find the app package
sys.path.append(os.getcwd())

try:
    from app.config import settings
    print(f"DATABASE_URL: {settings.database_url}")
    print(f"DATABASE_HOSTNAME: {settings.database_hostname}")
    print(f"DATABASE_PORT: {settings.database_port}")
    
    from app.database import SQLALCHEMY_DATABASE_URL
    print(f"ACTIVE URL: {SQLALCHEMY_DATABASE_URL}")
except Exception as e:
    print(f"Error: {e}")
