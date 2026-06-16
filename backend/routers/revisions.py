import os
import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from backend.database import get_db
from backend.models.models import Company, NegotiationDeck, ContractRevision
from backend.schemas.schemas import RevisionResponse, DiffResponse, DiffSegment
from backend.services.auth_service import get_current_company
from backend.services.doc_conversion import DocConversionService
from backend.services.git_service import GitService

router = APIRouter(prefix="/api/negotiations/{deck_id}/revisions", tags=["revisions"])

async def get_deck_or_404(deck_id: str, db: AsyncSession, current_company: Company) -> NegotiationDeck:
    result = await db.execute(select(NegotiationDeck).filter(NegotiationDeck.id == deck_id))
    deck = result.scalars().first()
    if not deck:
        raise HTTPException(status_code=404, detail="Negotiation not found")
    if deck.company_a_id != current_company.id and deck.company_b_id != current_company.id:
        raise HTTPException(status_code=403, detail="Not a participant in this negotiation")
    return deck

@router.post("", response_model=RevisionResponse, status_code=status.HTTP_201_CREATED)
async def upload_revision(
    deck_id: str,
    file: UploadFile = File(...),
    commit_message: str = "Uploaded new contract revision",
    db: AsyncSession = Depends(get_db),
    current_company: Company = Depends(get_current_company)
):
    deck = await get_deck_or_404(deck_id, db, current_company)
    
    ext = file.filename.split('.')[-1].lower()
    if ext != 'docx':
        raise HTTPException(status_code=400, detail="Only DOCX files are supported for contract upload.")
        
    temp_dir = Path(deck.repository_path) / "temp"
    temp_dir.mkdir(exist_ok=True)
    
    temp_file = temp_dir / file.filename
    with open(temp_file, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        md_text = DocConversionService.convert_to_markdown(str(temp_file), ext)
    except Exception as e:
        os.remove(temp_file)
        raise HTTPException(status_code=500, detail=f"Failed to process DOCX: {str(e)}")
        
    os.remove(temp_file)
    
    # Commit to Git
    commit_hash = GitService.commit_revision(deck.id, md_text, current_company.display_name, commit_message)
    
    # Record in DB
    rev_id = str(uuid.uuid4())
    new_rev = ContractRevision(
        id=rev_id,
        deck_id=deck.id,
        commit_hash=commit_hash,
        author_company_id=current_company.id,
        commit_message=commit_message
    )
    
    db.add(new_rev)
    await db.commit()
    await db.refresh(new_rev)
    
    # Load relationships for response
    result = await db.execute(
        select(ContractRevision)
        .options(selectinload(ContractRevision.author_company))
        .filter(ContractRevision.id == rev_id)
    )
    return result.scalars().first()

@router.get("", response_model=list[RevisionResponse])
async def list_revisions(
    deck_id: str,
    db: AsyncSession = Depends(get_db),
    current_company: Company = Depends(get_current_company)
):
    deck = await get_deck_or_404(deck_id, db, current_company)
    
    result = await db.execute(
        select(ContractRevision)
        .options(selectinload(ContractRevision.author_company))
        .filter(ContractRevision.deck_id == deck_id)
        .order_by(ContractRevision.created_at.desc())
    )
    return result.scalars().all()

@router.get("/{rev_id}/diff", response_model=DiffResponse)
async def get_revision_diff(
    deck_id: str,
    rev_id: str,
    db: AsyncSession = Depends(get_db),
    current_company: Company = Depends(get_current_company)
):
    deck = await get_deck_or_404(deck_id, db, current_company)
    
    result = await db.execute(
        select(ContractRevision)
        .filter(ContractRevision.id == rev_id, ContractRevision.deck_id == deck_id)
    )
    rev = result.scalars().first()
    if not rev:
        raise HTTPException(status_code=404, detail="Revision not found")
        
    # Get previous revision chronologically
    prev_result = await db.execute(
        select(ContractRevision)
        .filter(ContractRevision.deck_id == deck_id, ContractRevision.created_at < rev.created_at)
        .order_by(ContractRevision.created_at.desc())
    )
    prev_rev = prev_result.scalars().first()
    
    prev_hash = prev_rev.commit_hash if prev_rev else None
    
    diff_text = GitService.get_diff(deck.id, prev_hash, rev.commit_hash)
    
    # Simple segment parsing (just keeping the raw text for MVP frontend to display)
    segments = []
    for line in diff_text.split('\n'):
        if line.startswith('+') and not line.startswith('+++'):
            segments.append(DiffSegment(type="addition", content=line[1:]))
        elif line.startswith('-') and not line.startswith('---'):
            segments.append(DiffSegment(type="deletion", content=line[1:]))
        else:
            segments.append(DiffSegment(type="unchanged", content=line))
            
    return DiffResponse(
        deck_id=deck.id,
        revision_id=rev.id,
        previous_revision_id=prev_rev.id if prev_rev else None,
        diff_text=diff_text,
        segments=segments
    )

@router.get("/latest/download")
async def download_latest_revision(
    deck_id: str,
    db: AsyncSession = Depends(get_db),
    current_company: Company = Depends(get_current_company)
):
    deck = await get_deck_or_404(deck_id, db, current_company)
    
    result = await db.execute(
        select(ContractRevision)
        .filter(ContractRevision.deck_id == deck_id)
        .order_by(ContractRevision.created_at.desc())
    )
    latest_rev = result.scalars().first()
    if not latest_rev:
        raise HTTPException(status_code=404, detail="No revisions found")
        
    md_content = GitService.get_content_at(deck.id, latest_rev.commit_hash)
    if not md_content:
        raise HTTPException(status_code=404, detail="Contract content empty")
        
    exports_dir = Path(deck.repository_path) / "exports"
    exports_dir.mkdir(exist_ok=True)
    
    docx_path = exports_dir / f"contract_{latest_rev.commit_hash[:7]}.docx"
    
    if not docx_path.exists():
        try:
            DocConversionService.convert_markdown_to_docx(md_content, str(docx_path))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate DOCX: {str(e)}")
            
    return FileResponse(
        path=docx_path,
        filename=f"{deck.title.replace(' ', '_')}_latest.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
