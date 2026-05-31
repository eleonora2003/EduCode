from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from urllib.parse import urlencode
import httpx

from ..config import settings
from ..database import get_db
from ..models import User
from ..auth import create_access_token

router = APIRouter(prefix="/api/oauth", tags=["OAuth"])

# GOOGLE LOGIN 

@router.get("/google")
def google_login():
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": "http://localhost:8000/api/oauth/google/callback",
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent"
    }

    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return RedirectResponse(url)


@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):

    async with httpx.AsyncClient() as client:

        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": "http://localhost:8000/api/oauth/google/callback",
                "grant_type": "authorization_code",
            },
        )

        token_json = token_res.json()
        access_token = token_json.get("access_token")

        user_res = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        user_data = user_res.json()

        email = user_data["email"]
        name = user_data.get("name")
        sub = user_data.get("sub")

        user = db.query(User).filter(User.email == email).first()

        if not user:
            user = User(
                email=email,
                full_name=name,
                oauth_provider="google",
                oauth_id=sub
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            user.oauth_provider = "google"
            user.oauth_id = sub
            if name and not user.full_name:  
                user.full_name = name
            db.commit()
            db.refresh(user)

        jwt_token = create_access_token({"sub": user.email})

        return RedirectResponse(
            f"http://localhost:3000/oauth-success?token={jwt_token}"
        )


# GITHUB LOGIN 

@router.get("/github")
def github_login():
    params = {
        "client_id": settings.github_client_id,
        "redirect_uri": "http://localhost:8000/api/oauth/github/callback",
        "scope": "read:user user:email",
        "response_type": "code",
        "prompt": "select_account"
    }

    url = "https://github.com/login/oauth/authorize?" + urlencode(params)
    return RedirectResponse(url)


@router.get("/github/callback")
async def github_callback(code: str, db: Session = Depends(get_db)):

    async with httpx.AsyncClient() as client:

        token_res = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": code,
            },
        )

        token_json = token_res.json()
        access_token = token_json.get("access_token")

        user_res = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        user_data = user_res.json()

        emails_res = await client.get(
            "https://api.github.com/user/emails",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        emails = emails_res.json()
        primary_email = next((e["email"] for e in emails if e.get("primary")), None)

        email = primary_email or f"{user_data['id']}@github.local"
        name = user_data.get("name") or user_data.get("login")
        oauth_id = str(user_data["id"])

        user = db.query(User).filter(User.email == email).first()

        if not user:
            user = User(
                email=email,
                full_name=name,
                oauth_provider="github",
                oauth_id=oauth_id
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            user.oauth_provider = "github"
            user.oauth_id = oauth_id
            if name and not user.full_name:
                user.full_name = name
            db.commit()
            db.refresh(user)

        jwt_token = create_access_token({"sub": user.email})

        return RedirectResponse(
            f"http://localhost:3000/oauth-success?token={jwt_token}"
        )