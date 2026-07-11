from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Any
from app.db.session import get_db

router = APIRouter()

@router.get("/calculators", response_model=List[Any])
async def list_medical_calculators(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve clinical calculators.
    Includes strict medical disclaimers in the payload.
    """
from pydantic import BaseModel

class ClinicalInput(BaseModel):
    calculator_id: str
    variables: dict

@router.post("/calculate")
async def calculate_clinical_score(
    payload: ClinicalInput,
    db: AsyncSession = Depends(get_db)
):
    """
    Process clinical calculations on the backend to protect algorithms.
    """
    calc_id = payload.calculator_id
    vars = payload.variables
    
    result = {}
    if calc_id == "bmi-calculator":
        weight_kg = float(vars.get("weight", 0))
        height_cm = float(vars.get("height", 0))
        if weight_kg > 0 and height_cm > 0:
            height_m = height_cm / 100
            bmi = weight_kg / (height_m * height_m)
            result = {
                "bmi": round(bmi, 1),
                "category": "Normal" if 18.5 <= bmi <= 24.9 else "Abnormal"
            }
            
    return {
        "status": "success",
        "calculator": calc_id,
        "results": result,
        "disclaimer": "This tool is for educational purposes only and not intended for clinical diagnosis."
    }

@router.get("/calculators/{slug}")
async def get_medical_calculator(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get clinical logic and validation schemas for a specific calculator.
    """
    return {"message": "Not implemented"}

@router.get("/lab-references")
async def get_lab_reference_values(
    test_name: str = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Lookup reference ranges for laboratory values.
    """
    return []

@router.get("/clinical-scores/{slug}")
async def get_clinical_score(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve determinisitic clinical scoring structures (e.g., GCS, NEWS2).
    """
    return {"message": "Not implemented"}
