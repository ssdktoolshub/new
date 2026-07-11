# Import all the models, so that Base has them before being
# imported by Alembic
from app.db.base_class import Base
from app.models.user import User
from app.models.tool import Tool
from app.models.category import Category
from app.models.medical import MedicalCalculator, LabReferenceValue, ClinicalScore
from app.models.ai import AIRequestLog, AIServiceMetadata

# All models are now registered with Base.metadata
