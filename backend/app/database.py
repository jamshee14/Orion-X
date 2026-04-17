from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings # 1. Import your settings

import urllib.parse

# 2. Build the URL line-by-line OR use provided override
if settings.database_url:
    SQLALCHEMY_DATABASE_URL = settings.database_url
else:
    # URL encode the password to handle special characters like '#'
    encoded_password = urllib.parse.quote_plus(settings.database_password)
    SQLALCHEMY_DATABASE_URL = f"postgresql://{settings.database_user}:{encoded_password}@{settings.database_hostname}:{settings.database_port}/{settings.database_name}"

# 3. Feed the URL to the engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()