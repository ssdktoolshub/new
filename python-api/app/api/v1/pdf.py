from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from PyPDF2 import PdfMerger
import os
import uuid
from config import settings

router = APIRouter()

@router.post("/merge")
async def merge_pdfs(files: list[UploadFile] = File(...)):
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="At least 2 PDF files are required for merging")

    merger = PdfMerger()
    temp_files = []

    try:
        for file in files:
            if not file.filename.lower().endswith(".pdf"):
                raise HTTPException(status_code=400, detail=f"File {file.filename} is not a PDF")
            
            # Save file temporarily to disk for merging
            temp_path = os.path.join(settings.TEMP_DIR, f"{uuid.uuid4()}_{file.filename}")
            with open(temp_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            temp_files.append(temp_path)
            merger.append(temp_path)

        output_filename = f"merged_{uuid.uuid4().hex[:8]}.pdf"
        output_path = os.path.join(settings.TEMP_DIR, output_filename)
        
        with open(output_path, "wb") as f:
            merger.write(f)

        return {
            "status": "success",
            "filename": output_filename,
            "download_url": f"/v1/pdf/download/{output_filename}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF merging failed: {str(e)}")
    finally:
        merger.close()
        # Clean up initial uploads temp files
        for path in temp_files:
            if os.path.exists(path):
                os.remove(path)

@router.get("/download/{filename}")
async def download_file(filename: str):
    safe_filename = os.path.basename(filename)
    file_path = os.path.abspath(os.path.join(settings.TEMP_DIR, safe_filename))
    
    # Verify the path is within the allowed TEMP_DIR
    allowed_dir = os.path.abspath(settings.TEMP_DIR)
    if not file_path.startswith(allowed_dir):
        raise HTTPException(status_code=400, detail="Invalid access attempt")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found or expired")
    return FileResponse(file_path, media_type="application/pdf", filename=safe_filename)
