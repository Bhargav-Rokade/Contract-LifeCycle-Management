# Key Architecture Decisions

This document outlines the foundational decisions that guide the technical implementation of the Contract Intelligence Platform.

## 1. Local-First & Lightweight Storage
**Decision:** Use local SQLite and local file storage instead of managed cloud databases (e.g., PostgreSQL, AWS S3).
**Rationale:** The platform is designed as a demonstration product. Operating entirely on the local file system (via `aiosqlite` for async database access) drastically reduces setup complexity, removes infrastructure costs, and ensures the codebase remains highly portable and self-contained.

## 2. Markdown as the Source of Truth
**Decision:** All uploaded documents (`.docx`, `.pdf`) are immediately converted to Markdown. Versioning, diffing, and AI analysis are performed exclusively on the Markdown text.
**Rationale:** 
- Markdown is a flat, human-readable, and machine-readable text format. 
- It naturally interfaces well with Git for line-level and block-level diffing.
- It is highly token-efficient when passed to LLMs like OpenAI, unlike raw XML from Word documents or noisy PDF text extractions.
- Files can easily be compiled back into `.docx` format using `pypandoc`.

## 3. Git for Contract Versioning
**Decision:** Use a literal local Git repository to track contract revisions instead of a custom database ledger.
**Rationale:** Git is the industry standard for text version control. By initializing a hidden `.git` repository for every "Negotiation Deck" (`backend/services/git_service.py`), we gain access to robust, battle-tested algorithms for generating unified diffs, tracking author attribution, and managing history trees. No remote hosting (like GitHub) is required; it operates entirely locally.

## 4. Viewpoint-Dependent Compliance Engine (RAG)
**Decision:** Compliance analysis is run on the diffs (changes) of a revision, cross-referenced specifically against the reviewing company's vector store.
**Rationale:** In a negotiation, an amendment that benefits Company A might conflict with Company B's policies. Therefore, the system maintains separate FAISS vector indices for each company.
- **Diff Parsing:** Extracts only the added/removed clauses to save LLM tokens.
- **RAG via FAISS:** The changed clauses are embedded (`text-embedding-3-large`) and searched against the company's local FAISS index (`IndexFlatIP` on L2 normalized vectors) to find relevant internal policy excerpts.
- **LLM Evaluation:** OpenAI (`gpt-5-nano`) receives the clauses and the policy excerpts, returning a strictly structured JSON response indicating if the clause conflicts with the policy.

## 5. Security & Authentication
**Decision:** Native `bcrypt` via JWT.
**Rationale:** Originally, `passlib` was considered, but due to its abandonment and incompatibility with modern `bcrypt >= 4.0.0`, the system uses the native `bcrypt` module for password hashing. Authentication is handled via stateless JSON Web Tokens (JWT) ensuring the API can be scaled horizontally if ever migrated from SQLite.

## 6. Frontend Aesthetics
**Decision:** Vanilla CSS with strict tokens, no TailwindCSS, no glassmorphism.
**Rationale:** Legal software requires high legibility, trust, and formality. The UI enforces a tight, less-rounded design system (`border-radius: 3px/5px`) utilizing the fonts `Syne` (for formal display headers) and `Figtree` (for clean, readable body text). Colors are restricted to ink blacks, parchment whites, and a highly specific forest green accent to convey stability and professionalism.
