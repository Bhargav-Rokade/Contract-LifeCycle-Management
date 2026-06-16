import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.database import get_db
from backend.models.models import Company, KnowledgeBase
from backend.schemas.schemas import RegisterRequest, LoginRequest, TokenResponse, CompanyResponse
from backend.services.auth_service import get_password_hash, verify_password, create_access_token, get_current_company

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Validate company handle unique
    handle = request.company_handle.lower().strip()
    result = await db.execute(select(Company).filter(Company.company_handle == handle))
    existing_company = result.scalars().first()
    if existing_company:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company handle already registered"
        )
    
    # Create company and associated knowledge base
    company_id = str(uuid.uuid4())
    kb_id = str(uuid.uuid4())
    
    new_company = Company(
        id=company_id,
        company_handle=handle,
        display_name=request.display_name.strip(),
        password_hash=get_password_hash(request.password)
    )
    
    new_kb = KnowledgeBase(
        id=kb_id,
        company_id=company_id,
        last_rebuild_at=None
    )
    
    db.add(new_company)
    db.add(new_kb)
    await db.flush()  # populate fields and check constraints
    
    return new_company

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Find company by handle
    handle = request.company_handle.lower().strip()
    result = await db.execute(select(Company).filter(Company.company_handle == handle))
    company = result.scalars().first()
    
    if not company or not verify_password(request.password, company.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid company handle or password"
        )
    
    # Generate token
    token_data = {
        "sub": company.id,
        "handle": company.company_handle
    }
    access_token = create_access_token(data=token_data)
    
    return TokenResponse(access_token=access_token)

@router.get("/me", response_model=CompanyResponse)
async def get_me(current_company: Company = Depends(get_current_company)):
    return current_company
