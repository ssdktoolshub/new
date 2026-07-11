from sqlalchemy import Column, String, Boolean, Text, JSON, Float, Integer
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid
from app.db.base_class import Base

class MedicalCalculator(Base):
    __tablename__ = "medical_calculators"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    clinical_purpose = Column(Text)
    
    # Validation & Logic metadata stored as JSON structures
    inputs_schema = Column(JSON, default={})
    validation_rules = Column(JSON, default={})
    
    # Educational & Disclaimers
    educational_notes = Column(Text)
    disclaimer = Column(Text, default="For informational purposes only. Do not use for clinical decision making without consulting a qualified healthcare professional.")
    
    # Traceability
    version = Column(String(20), default="1.0.0")
    is_active = Column(Boolean, default=True)

class LabReferenceValue(Base):
    __tablename__ = "lab_reference_values"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_name = Column(String(150), nullable=False, index=True)
    category = Column(String(100), index=True)
    
    # Bounds
    min_value = Column(Float)
    max_value = Column(Float)
    unit = Column(String(50))
    
    # Variations (e.g., Male/Female, Pediatric)
    demographic_variations = Column(JSON, default={})
    clinical_significance = Column(Text)

class ClinicalScore(Base):
    __tablename__ = "clinical_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    
    criteria_schema = Column(JSON, default={})
    scoring_logic = Column(JSON, default={})
    interpretation = Column(Text)
