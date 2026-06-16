from datetime import datetime
from pydantic import BaseModel, Field

# Auth Schemas
class RegisterRequest(BaseModel):
    company_handle: str = Field(..., description="Unique slug identifier for the company")
    display_name: str = Field(..., description="Pretty display name for the company")
    password: str = Field(..., min_length=6, description="Password of at least 6 characters")

class LoginRequest(BaseModel):
    company_handle: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    company_id: str
    company_handle: str


# Company Schemas
class CompanyResponse(BaseModel):
    id: str
    company_handle: str
    display_name: str
    created_at: datetime

    class Config:
        from_attributes = True


# Knowledge Base Schemas
class KBDocumentResponse(BaseModel):
    id: str
    kb_id: str
    file_name: str
    file_type: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

class KBStatusResponse(BaseModel):
    kb_id: str
    company_id: str
    last_rebuild_at: datetime | None
    document_count: int


# Negotiation Schemas
class NegotiationCreateRequest(BaseModel):
    title: str = Field(..., min_length=3)
    counterparty_handle: str = Field(..., description="The unique handle of the company to negotiate with")

class NegotiationResponse(BaseModel):
    id: str
    title: str
    company_a: CompanyResponse
    company_b: CompanyResponse
    repository_path: str
    created_at: datetime

    class Config:
        from_attributes = True


# Revision Schemas
class RevisionResponse(BaseModel):
    id: str
    deck_id: str
    commit_hash: str
    author_company: CompanyResponse
    commit_message: str
    created_at: datetime

    class Config:
        from_attributes = True

class DiffSegment(BaseModel):
    type: str # "addition" | "deletion" | "unchanged"
    content: str

class DiffResponse(BaseModel):
    deck_id: str
    revision_id: str
    previous_revision_id: str | None
    diff_text: str
    segments: list[DiffSegment]


# Compliance Schemas
class ComplianceFindingResponse(BaseModel):
    id: str
    deck_id: str
    revision_id: str
    reviewing_company_id: str
    finding_type: str # potential_conflict, policy_alignment, manual_review_recommended
    clause_text: str
    policy_reference: str
    policy_excerpt: str
    summary: str
    created_at: datetime

    class Config:
        from_attributes = True
