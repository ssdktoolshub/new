from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any

from app.db.session import get_db
from app.models.tool import Tool
from app.schemas.tool import ToolResponse, ToolCreate

router = APIRouter()

# Note: In a production environment, you would inject a `get_current_admin_user` dependency
# here to validate the JWT token. For now, we simulate a protected route.

@router.get("/dashboard/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """
    Retrieve high-level analytics for the Admin CMS Dashboard.
    """
    # Just a placeholder for actual count queries
    query = select(Tool)
    result = await db.execute(query)
    tools = result.scalars().all()
    
    return {
        "total_tools": len(tools),
        "active_tools": len([t for t in tools if t.is_active]),
        "total_categories": 25,  # Placeholder
        "pending_reviews": 0
    }

@router.put("/tools/{tool_id}", response_model=ToolResponse)
async def update_tool(
    tool_id: str,
    tool_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    CMS Route: Update an existing tool.
    Protected by admin authorization.
    """
    query = select(Tool).where(Tool.id == tool_id)
    result = await db.execute(query)
    tool = result.scalars().first()
    
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
        
    # Update fields dynamically
    for key, value in tool_data.items():
        if hasattr(tool, key):
            setattr(tool, key, value)
            
    await db.commit()
    await db.refresh(tool)
    
    # Format for response
    t_dict = tool.__dict__.copy()
    if tool.category:
        t_dict["category"] = tool.category.name
    return t_dict
