from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.db.session import get_db
from app.models.tool import Tool
from app.schemas.tool import ToolResponse

router = APIRouter()

@router.get("/", response_model=List[ToolResponse])
async def read_tools(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 5000,
):
    """
    Retrieve all active tools from the enterprise registry.
    """
    query = select(Tool).where(Tool.is_active == True).offset(skip).limit(limit)
    result = await db.execute(query)
    tools = result.scalars().all()
    
    # Map the category name directly for frontend backwards compatibility
    response_list = []
    for t in tools:
        t_dict = t.__dict__.copy()
        if t.category:
            t_dict["category"] = t.category.name
        response_list.append(t_dict)
        
    return response_list

@router.get("/{slug}", response_model=ToolResponse)
async def read_tool(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve a specific tool by its unique slug.
    """
    query = select(Tool).where(Tool.slug == slug, Tool.is_active == True)
    result = await db.execute(query)
    tool = result.scalars().first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
        
    t_dict = tool.__dict__.copy()
    if tool.category:
        t_dict["category"] = tool.category.name
    return t_dict
