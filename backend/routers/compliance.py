import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.database import get_db
from backend.models.models import Company, NegotiationDeck, ContractRevision, ComplianceFinding
from backend.schemas.schemas import ComplianceFindingResponse
from backend.services.auth_service import get_current_company
from backend.services.compliance_service import ComplianceService
from backend.services.git_service import GitService

router = APIRouter(prefix="/api/negotiations/{deck_id}/revisions/{rev_id}/compliance", tags=["compliance"])

async def get_deck_and_revision(deck_id: str, rev_id: str, db: AsyncSession, current_company: Company):
    # Verify deck
    result_deck = await db.execute(select(NegotiationDeck).filter(NegotiationDeck.id == deck_id))
    deck = result_deck.scalars().first()
    if not deck:
        raise HTTPException(status_code=404, detail="Negotiation not found")
    if deck.company_a_id != current_company.id and deck.company_b_id != current_company.id:
        raise HTTPException(status_code=403, detail="Not a participant")

    # Verify revision
    result_rev = await db.execute(select(ContractRevision).filter(ContractRevision.id == rev_id, ContractRevision.deck_id == deck_id))
    rev = result_rev.scalars().first()
    if not rev:
        raise HTTPException(status_code=404, detail="Revision not found")
        
    return deck, rev

@router.post("", response_model=list[ComplianceFindingResponse])
async def run_compliance_review(
    deck_id: str,
    rev_id: str,
    db: AsyncSession = Depends(get_db),
    current_company: Company = Depends(get_current_company)
):
    deck, rev = await get_deck_and_revision(deck_id, rev_id, db, current_company)

    # Prevent running multiple times if already exists (optional, could just delete old ones)
    result_existing = await db.execute(
        select(ComplianceFinding)
        .filter(ComplianceFinding.revision_id == rev.id, ComplianceFinding.reviewing_company_id == current_company.id)
    )
    existing = result_existing.scalars().all()
    if existing:
        return existing # Return existing findings if already run

    # Get prev revision
    result_prev = await db.execute(
        select(ContractRevision)
        .filter(ContractRevision.deck_id == deck_id, ContractRevision.created_at < rev.created_at)
        .order_by(ContractRevision.created_at.desc())
    )
    prev_rev = result_prev.scalars().first()
    prev_hash = prev_rev.commit_hash if prev_rev else None

    # Get diff
    diff_text = GitService.get_diff(deck.id, prev_hash, rev.commit_hash)
    
    # Run analysis
    findings_data = await ComplianceService.review_revision(current_company.company_handle, diff_text)
    
    # Store findings
    db_findings = []
    for f_data in findings_data:
        finding = ComplianceFinding(
            id=str(uuid.uuid4()),
            deck_id=deck.id,
            revision_id=rev.id,
            reviewing_company_id=current_company.id,
            finding_type=f_data.get('finding_type', 'potential_conflict'),
            clause_text=f_data.get('clause_text', ''),
            policy_reference=f_data.get('policy_reference', 'Unknown Policy'),
            policy_excerpt=f_data.get('policy_excerpt', ''),
            summary=f_data.get('summary', '')
        )
        db.add(finding)
        db_findings.append(finding)
        
    await db.commit()
    
    # Reload for response
    for finding in db_findings:
        await db.refresh(finding)
        
    return db_findings

@router.get("", response_model=list[ComplianceFindingResponse])
async def get_compliance_findings(
    deck_id: str,
    rev_id: str,
    db: AsyncSession = Depends(get_db),
    current_company: Company = Depends(get_current_company)
):
    # Verify access
    await get_deck_and_revision(deck_id, rev_id, db, current_company)
    
    result = await db.execute(
        select(ComplianceFinding)
        .filter(ComplianceFinding.revision_id == rev_id, ComplianceFinding.reviewing_company_id == current_company.id)
        .order_by(ComplianceFinding.created_at.desc())
    )
    return result.scalars().all()
