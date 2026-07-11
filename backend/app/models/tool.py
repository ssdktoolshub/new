from sqlalchemy import Column, String, Boolean, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid
from app.db.base_class import Base
from sqlalchemy.orm import relationship

class Tool(Base):
    __tablename__ = "tools"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text)
    
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    
    # Search Engine Array Fields
    keywords = Column(ARRAY(String), default=[])
    tags = Column(ARRAY(String), default=[])
    aliases = Column(ARRAY(String), default=[])
    synonyms = Column(ARRAY(String), default=[])
    
    # Properties
    icon_url = Column(String(500))
    url_path = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    is_trending = Column(Boolean, default=False)
    
    # Metadata & SEO
    version = Column(String(50), default="1.0.0")
    seo_metadata = Column(JSON, default={})
    
    # Relationships
    category = relationship("Category", back_populates="tools")
