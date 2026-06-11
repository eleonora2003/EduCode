import json
import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..auth import get_current_user
from ..schemas import ChatRequest, ChatResponse, TemplateFromChat
from ..services.generation_service import generation_service

router = APIRouter(prefix="/api/chat", tags=["Chat"])

SYSTEM_PROMPT = """You are an AI teaching assistant for EduCode.

Help users create programming templates and tasks. Be clear and practical.

When the user asks you to CREATE or GENERATE a template (e.g. "generate me a template", "create a template for loops"), respond with JSON only:
{
  "reply": "Short friendly confirmation message",
  "template": {
    "name": "Template name",
    "language": "Python",
    "concept": "Loops",
    "difficulty": "Basic",
    "learning_goals": "What students should learn",
    "restrictions": "Rules and constraints for the task",
    "code_template": "Starter code with function stub"
  }
}

For all other messages, respond with JSON only:
{
  "reply": "Your helpful answer",
  "template": null
}"""


def _parse_chat_response(raw: str) -> ChatResponse:
    raw = raw.strip()
    try:
        data = json.loads(raw)
        template = None
        if data.get("template"):
            template = TemplateFromChat(**data["template"])
        return ChatResponse(reply=data.get("reply", raw), template=template)
    except (json.JSONDecodeError, TypeError, ValueError):
        pass

    fence = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw, re.DOTALL)
    if fence:
        try:
            data = json.loads(fence.group(1))
            template = None
            if data.get("template"):
                template = TemplateFromChat(**data["template"])
            return ChatResponse(reply=data.get("reply", raw), template=template)
        except (json.JSONDecodeError, TypeError, ValueError):
            pass

    return ChatResponse(reply=raw, template=None)


@router.post("", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for msg in request.messages:
            messages.append({"role": msg.role, "content": msg.content})

        response = generation_service.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7,
            max_tokens=2000,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content
        return _parse_chat_response(raw)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
