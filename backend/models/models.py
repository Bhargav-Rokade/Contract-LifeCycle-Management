from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database import Base

class Company(Base):
    __tablename__ = "companies"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    company_handle: Mapped[str] = mapped_column(String, unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String)
    password_hash: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    knowledge_base: Mapped["KnowledgeBase"] = relationship(back_populates="company", uselist=False, cascade="all, delete-orphan")

class KnowledgeBase(Base):
    __tablename__ = "knowledge_bases"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    company_id: Mapped[str] = mapped_column(String, ForeignKey("companies.id", ondelete="CASCADE"), unique=True)
    last_rebuild_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    company: Mapped["Company"] = relationship(back_populates="knowledge_base")
    documents: Mapped[list["KnowledgeBaseDocument"]] = relationship(back_populates="kb", cascade="all, delete-orphan")

class KnowledgeBaseDocument(Base):
    __tablename__ = "knowledge_base_documents"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    kb_id: Mapped[str] = mapped_column(String, ForeignKey("knowledge_bases.id", ondelete="CASCADE"))
    file_name: Mapped[str] = mapped_column(String)
    file_type: Mapped[str] = mapped_column(String) # pdf, docx, txt
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    kb: Mapped["KnowledgeBase"] = relationship(back_populates="documents")

class NegotiationDeck(Base):
    __tablename__ = "negotiation_decks"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String)
    company_a_id: Mapped[str] = mapped_column(String, ForeignKey("companies.id"))
    company_b_id: Mapped[str] = mapped_column(String, ForeignKey("companies.id"))
    repository_path: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company_a: Mapped["Company"] = relationship(foreign_keys=[company_a_id])
    company_b: Mapped["Company"] = relationship(foreign_keys=[company_b_id])
    revisions: Mapped[list["ContractRevision"]] = relationship(back_populates="deck", cascade="all, delete-orphan")
    findings: Mapped[list["ComplianceFinding"]] = relationship(back_populates="deck", cascade="all, delete-orphan")

class ContractRevision(Base):
    __tablename__ = "contract_revisions"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    deck_id: Mapped[str] = mapped_column(String, ForeignKey("negotiation_decks.id", ondelete="CASCADE"))
    commit_hash: Mapped[str] = mapped_column(String)
    author_company_id: Mapped[str] = mapped_column(String, ForeignKey("companies.id"))
    commit_message: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    deck: Mapped["NegotiationDeck"] = relationship(back_populates="revisions")
    author_company: Mapped["Company"] = relationship()
    findings: Mapped[list["ComplianceFinding"]] = relationship(back_populates="revision", cascade="all, delete-orphan")

class ComplianceFinding(Base):
    __tablename__ = "compliance_findings"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    deck_id: Mapped[str] = mapped_column(String, ForeignKey("negotiation_decks.id", ondelete="CASCADE"))
    revision_id: Mapped[str] = mapped_column(String, ForeignKey("contract_revisions.id", ondelete="CASCADE"))
    reviewing_company_id: Mapped[str] = mapped_column(String, ForeignKey("companies.id"))
    finding_type: Mapped[str] = mapped_column(String) # potential_conflict, policy_alignment, manual_review_recommended
    clause_text: Mapped[str] = mapped_column(Text)
    policy_reference: Mapped[str] = mapped_column(String)
    policy_excerpt: Mapped[str] = mapped_column(Text)
    summary: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    deck: Mapped["NegotiationDeck"] = relationship(back_populates="findings")
    revision: Mapped["ContractRevision"] = relationship(back_populates="findings")
    reviewing_company: Mapped["Company"] = relationship()
