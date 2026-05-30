from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..auth import get_current_user
from ..schemas import ChatRequest, ChatResponse
from ..services.generation_service import generation_service

router = APIRouter(prefix="/api/chat", tags=["Chat"])

# System prompt for the AI teaching assistant
SYSTEM_PROMPT = """You are an AI teaching assistant for EduCode, a platform that helps programming teachers create, validate, and export programming tasks.

Your role is to:
1. Help users generate ideas for programming projects and tasks
2. Provide guidance on creating effective programming exercises
3. Assist with creating custom templates for different types of programming challenges
4. Offer examples of good programming task structures
5. Give advice on appropriate difficulty levels and concepts to teach

You should be:
- Encouraging and supportive
- Clear and concise in your explanations
- Practical in your suggestions
- Knowledgeable about programming education best practices

When users ask about templates, you can suggest:
- Algorithm Challenges: Focus on problem-solving and algorithmic thinking
- Data Structure Practice: Emphasize proper use of data structures
- Real-World Problems: Create practical, applicable scenarios
- Code Optimization: Challenge students to improve efficiency

Always respond in a helpful, educational manner."""


@router.post("", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Chat with the AI teaching assistant.
    
    This endpoint allows users to have a conversation with an AI assistant
    that can help with creating programming tasks, templates, and teaching ideas.
    """
    try:
        # Convert the message history to the format expected by OpenAI
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT}
        ]
        
        # Add the conversation history
        for msg in request.messages:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        client = generation_service.client
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7,
            max_tokens=1500
        )
        
        reply = response.choices[0].message.content
        
        return ChatResponse(reply=reply)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI service error: {str(e)}"
        )