import os
import uuid
import shutil
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.database import get_db
from backend.models.models import Company, KnowledgeBase, KnowledgeBaseDocument
from backend.schemas.schemas import KBDocumentResponse, KBStatusResponse
from backend.services.auth_service import get_current_company
from backend.services.doc_conversion import DocConversionService
from backend.services.embedding_service import EmbeddingService
from backend.config import settings

router = APIRouter(prefix="/api/kb", tags=["knowledge_base"])

def get_company_dirs(company_handle: str) -> tuple[Path, Path]:
    company_dir = settings.DATA_DIR / "companies" / company_handle
    raw_dir = company_dir / "raw_docs"
    md_dir = company_dir / "processed_md"
    raw_dir.mkdir(parents=True, exist_ok=True)
    md_dir.mkdir(parents=True, exist_ok=True)
    return raw_dir, md_dir

@router.post("/documents", response_model=KBDocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_company: Company = Depends(get_current_company)
):
    # Support docx, pdf, txt, md
    ext = file.filename.split('.')[-1].lower()
    if ext not in ['docx', 'pdf', 'txt', 'md']:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use docx, pdf, md or txt.")
    
    # Check KB exists
    result = await db.execute(select(KnowledgeBase).filter(KnowledgeBase.company_id == current_company.id))
    kb = result.scalars().first()
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found.")

    raw_dir, md_dir = get_company_dirs(current_company.company_handle)
    
    # Save raw file
    raw_path = raw_dir / file.filename
    with open(raw_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Convert to MD
    try:
        md_text = DocConversionService.convert_to_markdown(str(raw_path), ext)
    except Exception as e:
        # cleanup raw if conversion fails
        os.remove(raw_path)
        raise HTTPException(status_code=500, detail=f"Failed to convert document: {str(e)}")
        
    md_path = md_dir / f"{file.filename}.md"
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_text)
        
    # Create DB entry
    doc_id = str(uuid.uuid4())
    new_doc = KnowledgeBaseDocument(
        id=doc_id,
        kb_id=kb.id,
        file_name=file.filename,
        file_type=ext
    )
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)
    
    return new_doc

@router.get("/documents", response_model=list[KBDocumentResponse])
async def list_documents(
    db: AsyncSession = Depends(get_db),
    current_company: Company = Depends(get_current_company)
):
    result = await db.execute(
        select(KnowledgeBaseDocument)
        .join(KnowledgeBase)
        .filter(KnowledgeBase.company_id == current_company.id)
        .order_by(KnowledgeBaseDocument.uploaded_at.desc())
    )
    return result.scalars().all()

@router.delete("/documents/{doc_id}")
async def delete_document(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    current_company: Company = Depends(get_current_company)
):
    result = await db.execute(
        select(KnowledgeBaseDocument)
        .join(KnowledgeBase)
        .filter(KnowledgeBaseDocument.id == doc_id, KnowledgeBase.company_id == current_company.id)
    )
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Delete files
    raw_dir, md_dir = get_company_dirs(current_company.company_handle)
    raw_path = raw_dir / doc.file_name
    md_path = md_dir / f"{doc.file_name}.md"
    
    if raw_path.exists():
        os.remove(raw_path)
    if md_path.exists():
        os.remove(md_path)
        
    await db.delete(doc)
    await db.commit()
    return {"message": "Document deleted successfully"}

@router.post("/rebuild")
async def rebuild_kb(
    db: AsyncSession = Depends(get_db),
    current_company: Company = Depends(get_current_company)
):
    result = await db.execute(select(KnowledgeBase).filter(KnowledgeBase.company_id == current_company.id))
    kb = result.scalars().first()
    
    _, md_dir = get_company_dirs(current_company.company_handle)
    
    # Gather all markdown files
    all_chunks = []
    if md_dir.exists():
        for md_file in md_dir.glob("*.md"):
            with open(md_file, "r", encoding="utf-8") as f:
                text = f.read()
                original_filename = md_file.name.replace(".md", "")
                chunks = EmbeddingService.chunk_text(text, source_file=original_filename)
                all_chunks.extend(chunks)
                
    # Build and save index
    try:
        await EmbeddingService.build_and_save_index(current_company.company_handle, all_chunks)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to rebuild index: {str(e)}")
        
    # Update timestamp
    kb.last_rebuild_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "Knowledge base rebuilt successfully", "chunks_indexed": len(all_chunks)}

@router.get("/status", response_model=KBStatusResponse)
async def get_kb_status(
    db: AsyncSession = Depends(get_db),
    current_company: Company = Depends(get_current_company)
):
    result = await db.execute(select(KnowledgeBase).filter(KnowledgeBase.company_id == current_company.id))
    kb = result.scalars().first()
    
    doc_result = await db.execute(select(KnowledgeBaseDocument).filter(KnowledgeBaseDocument.kb_id == kb.id))
    docs = doc_result.scalars().all()
    
    return KBStatusResponse(
        kb_id=kb.id,
        company_id=current_company.id,
        last_rebuild_at=kb.last_rebuild_at,
        document_count=len(docs)
    )
