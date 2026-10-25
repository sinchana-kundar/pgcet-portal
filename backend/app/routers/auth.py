from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, get_admin_user
from app.auth.security import create_access_token, hash_password, verify_password
from app.config import get_settings
from app.database import get_db
from app.models.user import User
from app.schemas.auth import Token, UserCreate, UserLogin, UserResponse
from app.utils.limiter import limiter

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.RATE_LIMIT_SIGNUP)
def signup(request: Request, user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new student account (or admin in test/dev mode)."""
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # Restrict admin role self-assignment in production
    target_role = "student"
    if user_data.role.value == "admin":
        if settings.TESTING or settings.ENVIRONMENT == "development":
            target_role = "admin"
        elif settings.ADMIN_SIGNUP_SECRET and request.headers.get("X-Admin-Secret") == settings.ADMIN_SIGNUP_SECRET:
            target_role = "admin"
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Public creation of admin accounts is restricted. Use create_admin.py or provide an admin secret.",
            )

    hashed_pw = hash_password(user_data.password)
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hashed_pw,
        role=target_role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=Token)
@limiter.limit(settings.RATE_LIMIT_LOGIN)
def login_json(request: Request, credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user with email and password via JSON payload."""
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )


    token = create_access_token({
        "sub": user.email,
        "user_id": user.id,
        "role": user.role,
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/token")
def login_swagger_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2 password flow endpoint to enable Swagger UI Authorize button.
    
    (Note: 'username' field accepts the user's email).
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({
        "sub": user.email,
        "user_id": user.id,
        "role": user.role,
    })
    return {
        "access_token": token,
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieve profile of the currently logged-in user."""
    return current_user


@router.get("/admin-check")
def admin_rbac_test(admin_user: User = Depends(get_admin_user)):
    """Test endpoint to verify Role-Based Access Control (Admin only)."""
    return {
        "message": f"Welcome Admin {admin_user.name}! Access granted.",
        "admin_id": admin_user.id,
        "email": admin_user.email,
        "role": admin_user.role,
    }
