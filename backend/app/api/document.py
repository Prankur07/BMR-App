from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from app.models.schemas import MandiDocumentRequest, MandiDocumentResponse, TagColor, ConfigResponse
from app.services.document_generator import create_mandi_document
from app.services.pdf_generator import generate_pdf
from datetime import datetime
import base64
import json
import os

router = APIRouter()

# Load config from frontend/public/config.json
CONFIG_PATH = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'frontend', 'public', 'config.json')


def load_config():
    with open(CONFIG_PATH, 'r') as f:
        return json.load(f)


@router.get("/config", response_model=ConfigResponse)
async def get_config():
    config = load_config()
    return ConfigResponse(**config)


@router.post("/generate-docx")
async def generate_docx(data: MandiDocumentRequest):
    try:
        docx_bytes = create_mandi_document(data)
        filename = f"Mandi_Gate_Pass_{data.mandi_name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.docx"
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-pdf")
async def generate_pdf_endpoint(data: MandiDocumentRequest):
    try:
        pdf_bytes = generate_pdf(data)
        filename = f"Mandi_Gate_Pass_{data.mandi_name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-pdf-base64")
async def generate_pdf_base64(data: MandiDocumentRequest):
    try:
        pdf_bytes = generate_pdf(data)
        return {"pdf_base64": base64.b64encode(pdf_bytes).decode('utf-8')}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tag-colors")
async def get_tag_colors():
    config = load_config()
    return {"colors": config.get("tag_colors", [])}