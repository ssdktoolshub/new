from sqlalchemy import Column, String, Boolean, Enum
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from app.db.base_class import Base

class RoleEnum(str, enum.Enum):
    GUEST = "guest"
    USER = "user"
    PREMIUM = "premium"
    MODERATOR = "moderator"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    display_name = Column(String(150))
    hashed_password = Column(String(255), nullable=False)
    
    # Profile & Preferences
    avatar_url = Column(String(500))
    theme_preference = Column(String(20), default="dark")
    language_preference = Column(String(10), default="en")
    
    # Flags & Roles
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.USER)
