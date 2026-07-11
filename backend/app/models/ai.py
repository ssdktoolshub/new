from sqlalchemy import Column, String, Integer, JSON, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.db.base_class import Base
from sqlalchemy.orm import relationship

class AIRequestLog(Base):
    __tablename__ = "ai_request_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True) # Allow anonymous if enabled
    
    service_type = Column(String(50), index=True) # e.g., 'ocr', 'translation', 'summarization'
    prompt_metadata = Column(JSON, default={})
    
    # Token Usage & Cost tracking
    tokens_input = Column(Integer, default=0)
    tokens_output = Column(Integer, default=0)
    processing_time_ms = Column(Float, default=0.0)
    
    status = Column(String(20), default="completed") # 'completed', 'failed', 'processing'
    error_message = Column(String(500))

class AIServiceMetadata(Base):
    __tablename__ = "ai_service_metadata"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_name = Column(String(100), unique=True, index=True)
    provider = Column(String(50)) # e.g., 'openai', 'anthropic', 'local'
    model_version = Column(String(50))
    
    is_active = Column(Boolean, default=True)
    cost_per_1k_tokens = Column(Float, default=0.0)
