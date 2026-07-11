from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from uuid import UUID

class ToolBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    keywords: List[str] = []
    tags: List[str] = []
    aliases: List[str] = []
    synonyms: List[str] = []
    icon_url: Optional[str] = None
    url_path: str
    is_active: bool = True
    is_featured: bool = False
    is_trending: bool = False
    version: str = "1.0.0"
    seo_metadata: Dict[str, Any] = {}

class ToolCreate(ToolBase):
    pass

class ToolResponse(ToolBase):
    id: UUID
    
    # Optional category mapping if front-end expects it flat
    category: Optional[str] = None

    class Config:
        orm_mode = True
        from_attributes = True
