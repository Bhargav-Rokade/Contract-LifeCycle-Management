import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import or_

from backend.database import get_db
from backend.models.models import Company, NegotiationDeck
from backend.schemas.schemas import NegotiationCreateRequest, NegotiationResponse
from backend.services.auth_service import get_current_company
from backend.services.git_service import GitService

router = APIRouter(prefix="/api/negotiations", tags=["negotiations"])

@router.get("", response_model=list[NegotiationResponse])
async def list_negotiations(
    db: AsyncSession = Depends(get_db),
    current_company: Company = Depends(get_current_company)
):
    query = (
        select(NegotiationDeck)
        .options(selectinload(NegotiationDeck.company_a), selectinload(NegotiationDeck.company_b))
        .filter(
            or_(
                NegotiationDeck.company_a_id == current_company.id,
                NegotiationDeck.company_b_id == current_company.id
            )
        )
        .order_by(NegotiationDeck.created_at.desc())
    )
    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=NegotiationResponse, status_code=status.HTTP_201_CREATED)
async def create_negotiation(
    request: NegotiationCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_company: Company = Depends(get_current_company)
):
    # Find counterparty
    handle = request.counterparty_handle.lower().strip()
    result = await db.execute(select(Company).filter(Company.company_handle == handle))
    counterparty = result.scalars().first()
    
    if not counterparty:
        raise HTTPException(status_code=404, detail="Counterparty not found")
        
    if counterparty.id == current_company.id:
        raise HTTPException(status_code=400, detail="Cannot negotiate with yourself")
        
    deck_id = str(uuid.uuid4())
    repo_path = GitService.init_repo(deck_id)
    
    new_deck = NegotiationDeck(
        id=deck_id,
        title=request.title.strip(),
        company_a_id=current_company.id,
        company_b_id=counterparty.id,
        repository_path=str(repo_path)
    )
    
    db.add(new_deck)
    await db.commit()
    await db.refresh(new_deck)
    
    # Reload with relationships
    result = await db.execute(
        select(NegotiationDeck)
        .options(selectinload(NegotiationDeck.company_a), selectinload(NegotiationDeck.company_b))
        .filter(NegotiationDeck.id == deck_id)
    )
    return result.scalars().first()

@router.get("/{deck_id}", response_model=NegotiationResponse)
async def get_negotiation(
    deck_id: str,
    db: AsyncSession = Depends(get_db),
    current_company: Company = Depends(get_current_company)
):
    result = await db.execute(
        select(NegotiationDeck)
        .options(selectinload(NegotiationDeck.company_a), selectinload(NegotiationDeck.company_b))
        .filter(NegotiationDeck.id == deck_id)
    )
    deck = result.scalars().first()
    
    if not deck:
        raise HTTPException(status_code=404, detail="Negotiation not found")
        
    if deck.company_a_id != current_company.id and deck.company_b_id != current_company.id:
        raise HTTPException(status_code=403, detail="Not a participant in this negotiation")
        
    return deck
