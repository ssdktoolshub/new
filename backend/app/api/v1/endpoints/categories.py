from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.db.session import get_db
from app.models.category import Category
from app.schemas.category import CategoryResponse

router = APIRouter()

@router.get("/", response_model=List[CategoryResponse])
async def read_categories(
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve all active categories from the enterprise registry.
    Sorted by visual priority (order).
    """
    query = select(Category).where(Category.is_active == True).order_by(Category.order)
    result = await db.execute(query)
    categories = result.scalars().all()
    return categories
