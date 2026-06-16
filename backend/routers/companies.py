from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_

from backend.database import get_db
from backend.models.models import Company
from backend.schemas.schemas import CompanyResponse
from backend.services.auth_service import get_current_company

router = APIRouter(prefix="/api/companies", tags=["companies"])

@router.get("/search", response_model=list[CompanyResponse])
async def search_companies(
    handle: str = "",
    db: AsyncSession = Depends(get_db),
    current_company: Company = Depends(get_current_company)
):
    """
    Search for other companies by company handle or display name.
    Excludes the current requesting company.
    """
    handle_query = handle.lower().strip()
    if not handle_query:
        # If no query parameter, return empty list or all companies except current
        # Let's return all other companies up to some limit (e.g. 50)
        query = select(Company).filter(Company.id != current_company.id).limit(50)
    else:
        query = select(Company).filter(
            Company.id != current_company.id,
            or_(
                Company.company_handle.like(f"%{handle_query}%"),
                Company.display_name.like(f"%{handle_query}%")
            )
        ).limit(50)
        
    result = await db.execute(query)
    companies = result.scalars().all()
    return companies
