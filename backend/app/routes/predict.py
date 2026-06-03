from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image
import io

from app.utils.face_detection import crop_face
from app.models.face_shape import classify_face_shape, get_hairstyle_recommendations

router = APIRouter()


@router.post("/predict")
async def predict_hairstyle(file: UploadFile = File(...)):
    if file.content_type not in ["image/jpeg", "image/jpg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Ukuran file maksimal 5MB.")

    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="File bukan gambar yang valid.")

    face_crop = crop_face(image)
    if face_crop is None:
        raise HTTPException(status_code=422, detail="Wajah tidak terdeteksi. Pastikan wajah terlihat jelas dan pencahayaan cukup.")

    try:
        face_shape, confidence = classify_face_shape(face_crop)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

    recommendations = get_hairstyle_recommendations(face_shape)

    return JSONResponse(content={
        "face_shape": face_shape,
        "confidence": confidence,
        "recommendations": recommendations,
    })
