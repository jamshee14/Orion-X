from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas, auth, database

router = APIRouter()

@router.post("/register", response_model=schemas.UserOut)
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    # 1. Check if user exists
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # 2. Hash the password
    hashed_pass = auth.get_password_hash(user.password)
    
    # 3. Create new user object
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_pass,
        role=user.role
    )
    
    # 4. Save to Postgres
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user