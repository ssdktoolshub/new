from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict, Any
from uuid import UUID

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    emoji: Optional[str] = ""
    order: int = 99
    is_active: bool = True
    slug: str

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: UUID
    
    class Config:
        orm_mode = True
        from_attributes = True
