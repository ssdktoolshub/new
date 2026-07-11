import uuid
from typing import Any
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, DateTime
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID

class Base(DeclarativeBase):
    id: Any
    
    # Global timestamps for all models
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    __name__: str

    # Generate __tablename__ automatically
    @classmethod
    def __declared_attr__(cls) -> str:
        return cls.__name__.lower()
