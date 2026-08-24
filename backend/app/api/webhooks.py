from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, XMLResponse

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/telnyx")
async def telnyx_webhook(request: Request):
    body = await request.json()
    event_type = body.get("data", {}).get("event_type", "")
    payload = body.get("data", {}).get("payload", {})

    # TODO: Verify webhook signature using TELNYX_PUBLIC_KEY
    # TODO: Route events to call manager (answered, hangup, hold, etc.)

    return JSONResponse(content={"status": "ok"})


@router.post("/telnyx/voice")
async def telnyx_voice_webhook(request: Request):
    # Handles inbound call TeXML responses
    # TODO: Return TeXML that connects call to media stream
    xml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Hello. Please hold while we connect you.</Say>
</Response>"""
    return XMLResponse(content=xml, media_type="application/xml")
