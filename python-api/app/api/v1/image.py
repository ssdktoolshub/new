from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from PIL import Image
import os
import uuid
from config import settings

router = APIRouter()

@router.post("/compress")
async def compress_image(
    file: UploadFile = File(...),
    quality: int = Form(75)
):
    if not file.filename.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
        raise HTTPException(status_code=400, detail="Only PNG, JPG, JPEG, and WebP files are supported")

    temp_input_path = os.path.join(settings.TEMP_DIR, f"{uuid.uuid4()}_{file.filename}")
    output_filename = f"compressed_{uuid.uuid4().hex[:8]}_{file.filename}"
    temp_output_path = os.path.join(settings.TEMP_DIR, output_filename)

    try:
        # Save input file
        with open(temp_input_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # Open and compress using Pillow
        with Image.open(temp_input_path) as img:
            # Handle RGBA/transparency for JPG conversions if necessary
            if img.mode in ("RGBA", "LA") and file.filename.lower().endswith((".jpg", ".jpeg")):
                img = img.convert("RGB")
            
            img.save(temp_output_path, quality=quality, optimize=True)

        return {
            "status": "success",
            "filename": output_filename,
            "download_url": f"/v1/image/download/{output_filename}",
            "original_size": os.path.getsize(temp_input_path),
            "compressed_size": os.path.getsize(temp_output_path)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image compression failed: {str(e)}")
    finally:
        # Clean up input temp file
        if os.path.exists(temp_input_path):
            os.remove(temp_input_path)

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
    
    # Determine media type based on extension
    ext = safe_filename.lower().split(".")[-1]
    media_type = f"image/{ext}" if ext in ("png", "jpg", "jpeg", "webp") else "application/octet-stream"
    
    return FileResponse(file_path, media_type=media_type, filename=safe_filename)
