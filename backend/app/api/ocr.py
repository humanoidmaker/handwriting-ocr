import base64
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException

from ..core.auth import get_current_user
from ..core.database import get_db
from ..ml.handwriting_reader import read, get_preprocessed_image_bytes

router = APIRouter(prefix="/api/ocr", tags=["ocr"])


@router.post("/read")
async def read_handwriting(file: UploadFile = File(...), user=Depends(get_current_user)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 10MB")

    user_settings = {
        "denoise_level": user.get("denoise_level", 3),
        "contrast_boost": user.get("contrast_boost", 1.2),
        "deskew_enabled": user.get("deskew_enabled", True),
    }

    result = read(
        image_bytes,
        enhance=user.get("default_enhance", True),
        **user_settings,
    )

    preprocessed = get_preprocessed_image_bytes(image_bytes, enhance=True, **user_settings)
    preprocessed_b64 = base64.b64encode(preprocessed).decode()

    db = get_db()
    scan_doc = {
        "user_id": user["_id"],
        "filename": file.filename,
        "text": result["text"],
        "confidence": result["confidence"],
        "lines": result["lines"],
        "preprocessing_applied": result["preprocessing_applied"],
        "enhanced": True,
        "created_at": datetime.now(timezone.utc),
    }
    insert = await db.scans.insert_one(scan_doc)

    return {
        "id": str(insert.inserted_id),
        "text": result["text"],
        "confidence": result["confidence"],
        "lines": result["lines"],
        "preprocessing_applied": result["preprocessing_applied"],
        "preprocessed_image": f"data:image/png;base64,{preprocessed_b64}",
    }


@router.post("/read-enhanced")
async def read_enhanced(file: UploadFile = File(...), user=Depends(get_current_user)):
    """Enhanced mode with maximum preprocessing for impaired handwriting."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 10MB")

    result = read(
        image_bytes,
        enhance=True,
        denoise_level=7,
        contrast_boost=1.5,
        deskew_enabled=True,
    )

    preprocessed = get_preprocessed_image_bytes(
        image_bytes, enhance=True, denoise_level=7, contrast_boost=1.5, deskew_enabled=True
    )
    preprocessed_b64 = base64.b64encode(preprocessed).decode()

    db = get_db()
    scan_doc = {
        "user_id": user["_id"],
        "filename": file.filename,
        "text": result["text"],
        "confidence": result["confidence"],
        "lines": result["lines"],
        "preprocessing_applied": result["preprocessing_applied"],
        "enhanced": True,
        "mode": "enhanced",
        "created_at": datetime.now(timezone.utc),
    }
    insert = await db.scans.insert_one(scan_doc)

    return {
        "id": str(insert.inserted_id),
        "text": result["text"],
        "confidence": result["confidence"],
        "lines": result["lines"],
        "preprocessing_applied": result["preprocessing_applied"],
        "preprocessed_image": f"data:image/png;base64,{preprocessed_b64}",
    }


@router.get("/history")
async def get_history(skip: int = 0, limit: int = 20, user=Depends(get_current_user)):
    db = get_db()
    cursor = db.scans.find({"user_id": user["_id"]}).sort("created_at", -1).skip(skip).limit(limit)
    scans = []
    async for scan in cursor:
        scans.append({
            "id": str(scan["_id"]),
            "filename": scan.get("filename", ""),
            "text": scan["text"][:100] + "..." if len(scan.get("text", "")) > 100 else scan.get("text", ""),
            "confidence": scan.get("confidence", 0),
            "created_at": scan["created_at"].isoformat(),
        })
    return scans


@router.get("/stats")
async def get_stats(user=Depends(get_current_user)):
    db = get_db()
    total = await db.scans.count_documents({"user_id": user["_id"]})

    pipeline = [
        {"$match": {"user_id": user["_id"]}},
        {"$group": {
            "_id": None,
            "avg_confidence": {"$avg": "$confidence"},
            "total_lines": {"$sum": {"$size": {"$ifNull": ["$lines", []]}}},
        }},
    ]
    result = await db.scans.aggregate(pipeline).to_list(1)

    stats = result[0] if result else {"avg_confidence": 0, "total_lines": 0}

    recent_pipeline = [
        {"$match": {"user_id": user["_id"]}},
        {"$sort": {"created_at": -1}},
        {"$limit": 30},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "count": {"$sum": 1},
            "avg_confidence": {"$avg": "$confidence"},
        }},
        {"$sort": {"_id": 1}},
    ]
    trends = await db.scans.aggregate(recent_pipeline).to_list(30)

    return {
        "total_scans": total,
        "avg_confidence": round(stats.get("avg_confidence", 0) or 0, 1),
        "total_lines_read": stats.get("total_lines", 0),
        "trends": [{"date": t["_id"], "count": t["count"], "confidence": round(t["avg_confidence"], 1)} for t in trends],
    }
