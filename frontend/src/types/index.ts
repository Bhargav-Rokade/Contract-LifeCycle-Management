export interface Company {
  id: string;
  company_handle: string;
  display_name: string;
  created_at: string;
}

export interface KBDocument {
  id: string;
  kb_id: string;
  file_name: string;
  file_type: string;
  uploaded_at: string;
}

export interface KBStatus {
  kb_id: string;
  company_id: string;
  last_rebuild_at: string | null;
  document_count: number;
}

export interface NegotiationDeck {
  id: string;
  title: string;
  company_a: Company;
  company_b: Company;
  repository_path: string;
  created_at: string;
}

export interface ContractRevision {
  id: string;
  deck_id: string;
  commit_hash: string;
  author_company: Company;
  commit_message: string;
  created_at: string;
}

export interface DiffSegment {
  type: 'addition' | 'deletion' | 'unchanged';
  content: string;
}

export interface DiffResponse {
  deck_id: string;
  revision_id: string;
  previous_revision_id: string | null;
  diff_text: string;
  segments: DiffSegment[];
}

export interface ComplianceFinding {
  id: string;
  deck_id: string;
  revision_id: string;
  reviewing_company_id: string;
  finding_type: 'potential_conflict' | 'policy_alignment' | 'manual_review_recommended';
  clause_text: string;
  policy_reference: string;
  policy_excerpt: string;
  summary: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}
