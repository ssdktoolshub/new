from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    username: str
    display_name: Optional[str] = None
    language_preference: Optional[str] = "en"
    theme_preference: Optional[str] = "dark"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    language_preference: Optional[str] = None
    theme_preference: Optional[str] = None

class UserInDBBase(UserBase):
    id: UUID
    is_active: bool
    is_verified: bool
    role: str
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserResponse(UserInDBBase):
    pass
