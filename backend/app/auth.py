from jose import JWTError,jwt
from .import schemas,database,models
from fastapi import Depends,HTTPException,status,Request
from sqlalchemy.orm import Session
from datetime import datetime,timedelta
from .config import settings
from passlib.context import CryptContext 

SECRET_KEY = settings.secret_key
ALGORITHM = settings.algorithm
ACCESS_TOKEN_EXPIRE = settings.access_token_expire
# 1. Import the library

# 2. Tell passlib to use bcrypt for password hashing
# Use a specific configuration to avoid the 72-byte issue with newer bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__truncate_error=False)

# 3. Add the missing function that the error is complaining about
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# 4. (Bonus) Add this for when you create new users during registration
def get_password_hash(password):
    return pwd_context.hash(password)
def create_access_token(data:dict):
    to_encode=data.copy()
    expire=datetime.utcnow()+timedelta(minutes=ACCESS_TOKEN_EXPIRE)
    to_encode.update({"exp":expire})
    encoded_jwt=jwt.encode(to_encode,SECRET_KEY,algorithm=ALGORITHM)
    return encoded_jwt
def verify_access_token(token:str,credentials_exception):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_email: str = payload.get("sub")
        if user_email is None:
            raise credentials_exception
        token_data = schemas.TokenData(id=user_email)
    except JWTError:
        raise credentials_exception
    return token_data
def get_current_user_from_cookie(request:Request,db:Session=Depends(database.get_db)):
    token = request.cookies.get("token")
    if not token:
        auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            token = auth_header.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="not authorized")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_email: str = payload.get("sub")
        user_role: str = payload.get("role")
        if user_email is None or user_role is None:
            raise HTTPException(status_code=401, detail="Invalid token data")
    except JWTError:
        raise HTTPException(status_code=401, detail="token expired or invalid")
    user = db.query(models.User).filter(
        models.User.email == user_email,
        models.User.role == user_role
    ).first()
    return user
