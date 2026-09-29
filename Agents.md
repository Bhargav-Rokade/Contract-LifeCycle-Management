# Agent Handover: Project State & Context

If you are an AI Coding Agent taking over this project, this document will help you understand what has been completed, where the critical assets are located, and how to verify/run the workspace.

## 1. High-Level Project State
All core features of the **Contract Intelligence Platform** are fully implemented, compiled, and verified:
- **FastAPI Backend**: Uses an SQLite database (`database/app.db`) through `aiosqlite` and `SQLAlchemy`.
- **Git-Backed Versioning**: Tracks files locally (in `negotiations/`) as Git commits.
- **RAG-Powered Compliance**: Converts files to Markdown, embeds them using `text-embedding-3-large`, index/queries them via `faiss-cpu`, and uses OpenAI `gpt-5-nano` for compliance checks.
- **Vite React TS Frontend**: Completely styled with a custom parchment and forest green design system (Vanilla CSS with CSS variables, no Tailwind, clean fonts).
- **Multi-File Workspace**: Supports negotiating multiple documents (e.g. `NDA.md`, `SOW.md`) concurrently inside the same negotiation repository.

---

## 2. Directory Map for Quick Scans
- `backend/models/models.py`: Database schema definitions (Company, KnowledgeBase, NegotiationDeck, ContractRevision, ComplianceFinding).
- `backend/services/git_service.py`: Encapsulates Git interactions (creating repos, staging/committing files, extracting file-specific logs, generating diffs).
- `backend/services/compliance_service.py`: Contains diff parsing, FAISS vector querying, and OpenAI completion calls.
- `backend/routers/`: Routers for `auth.py`, `companies.py`, `knowledge_base.py`, `negotiations.py`, `revisions.py`, and `compliance.py`.
- `frontend/src/components/`: Layout wrappers, reused `Footer`, `AuthLeft` panel, `DiffViewer`, and `ComplianceFindingCard`.
- `frontend/src/pages/`: Pages for `LoginPage`, `RegisterPage`, `NegotiationPage`, `KnowledgeBasePage`, `NewNegotiationPage`, and `NegotiationDeckPage`.
- `frontend/src/api/`: Typed Axios client wrappers communicating with the backend.

---

## 3. Crucial Architectural Implementations
As the next developer, you must keep these constraints in mind:

### Database Schema Auto-Migration
To avoid breaking pre-existing development database files during schema changes, `backend/main.py` runs a safe DDL query on start:
```python
await conn.execute(text("ALTER TABLE contract_revisions ADD COLUMN filename VARCHAR DEFAULT 'contract.md';"))
```
Any raw SQL statements run on `connection.execute` inside SQLAlchemy 2.0 **must** be wrapped in a `text()` block to prevent `TypeError` or execution failure.

### Auth Hashing
Do not use `passlib` for hashing. It has an unresolved bug checking the version of modern `bcrypt >= 4.0.0` packages. Instead, the backend calls the native `bcrypt` package directly in `backend/services/auth_service.py`:
```python
bcrypt.checkpw(password_bytes, hashed_bytes)
```

### Frontend Safety Warning Checks
- **List View Uploads**: In `NegotiationDeckPage.tsx`, when a user uploads a `.docx` file from the main file selection list, the app checks if a file with the same name already exists in the deck. If it does, a warning alert pops up asking if they want to overwrite/update it.
- **File Workspace Uploads**: When viewing a specific document's timeline (e.g. `nda.md`), the app verifies that the uploaded revision has the matching base name (e.g. `nda.docx`). If it mismatches (e.g. trying to upload `sow.docx`), the upload is blocked to keep file histories clean.

---

## 4. Run/Verify Commands
Make sure your virtual environment (`.venv`) is active, pandoc is installed on your OS, and your `.env` contains valid keys.

**Run Backend (FastAPI):**
```bash
python -m uvicorn backend.main:app --reload
```

**Run/Build Frontend (Vite):**
```bash
cd frontend
npm run dev    # Start development server on port 5173
npm run build  # Validate TypeScript compilation and generate production bundle
```
Vite proxies all `/api` requests to `http://localhost:8000`.
