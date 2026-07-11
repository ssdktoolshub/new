from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import OAuth2PasswordRequestForm
from app.db.session import get_db
# In future, import user service logic here

router = APIRouter()

@router.post("/login/access-token")
async def login_access_token(
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    # TODO: Implement user fetching and password verification via User Service
    # user = await user_service.authenticate(db, email=form_data.username, password=form_data.password)
    # if not user:
    #    raise HTTPException(status_code=400, detail="Incorrect email or password")
    # elif not user.is_active:
    #    raise HTTPException(status_code=400, detail="Inactive user")
    return {
        "access_token": "dummy-token-replace-me",
        "token_type": "bearer"
    }

@router.post("/register")
async def register_user(
    # user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create new user.
    """
    # TODO: Implement User Registration Logic
    return {"message": "User registered successfully"}
