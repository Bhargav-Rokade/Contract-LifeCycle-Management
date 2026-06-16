# Agent Protocol: Contract Intelligence Platform

Hello, fellow AI Agent. If you are reading this, you have been tasked with continuing the development, maintenance, or scaling of the **Contract Intelligence Platform**. 

This document contains critical context, constraints, and architectural guidelines that you must adhere to. Do not deviate from these principles without explicit permission from the human user.

## 1. Project Philosophy & Scope
- **Purpose**: This is a contract negotiation and compliance intelligence platform. It tracks revisions between two parties and evaluates changes against internal policies.
- **Not a CLM**: This is *not* a standard Contract Lifecycle Management suite or a real-time document editor.
- **Demonstration Scale**: The project prioritizes explainability, simplicity, and local execution over enterprise-scale cloud deployment. 

## 2. Technology Stack
- **Backend**: Python 3.13+, FastAPI, SQLAlchemy (Async), SQLite (`aiosqlite`).
- **Frontend**: React 18, Vite, TypeScript, Zustand (state management), Axios.
- **Styling**: Vanilla CSS with CSS Variables/Tokens (`frontend/src/index.css`). **DO NOT USE TAILWIND CSS** unless explicitly requested by the user. The aesthetic is formal, using `Syne` and `Figtree` fonts, with a forest green/parchment color palette.
- **AI & ML**: OpenAI API (`gpt-5-nano` or latest equivalent) for compliance analysis. Local FAISS (`faiss-cpu`) for Retrieval-Augmented Generation (RAG). `text-embedding-3-large` for embeddings.

## 3. Core Architectural Constraints
1. **Markdown is the Source of Truth**: Contracts and policy documents are uploaded as `.docx` or `.pdf` but are immediately converted to Markdown. All versioning, diffing, and LLM analysis happens on the Markdown text.
2. **Local Git for Versioning**: Every negotiation deck has its own isolated local Git repository stored in the `/negotiations/` directory. Revisions are tracked as Git commits via `GitPython`. Do not attempt to integrate GitHub or external Git hosting.
3. **Local Storage**: Use SQLite (`/database/app.db`) and local directories (`/data/`, `/vectorstores/`, `/negotiations/`). Do not migrate to PostgreSQL or AWS S3.
4. **Viewpoint-Dependent Analysis**: Compliance analysis is run from the perspective of the *reviewing* company against *their* specific FAISS vector store.

## 4. Development Guidelines
- **Dependencies**: Keep Python dependencies in `requirements.txt` unpinned (latest versions) to avoid cross-platform build failures, especially with packages like `pymupdf` or `faiss-cpu`.
- **Authentication**: JWT-based authentication. Passwords are hashed using the native `bcrypt` package (do not use `passlib`, it is incompatible with modern bcrypt versions).
- **Tooling Preferences**: When editing files, prioritize using `multi_replace_file_content` for surgical edits rather than rewriting entire files.
- **Design Aesthetic**: If you add new UI components, strictly follow the existing CSS tokens. Do not introduce generic blue/pink hues, heavy glassmorphism, or overly rounded buttons (`border-radius` is tight). Keep the language formal and professional.

## 5. Directory Structure Context
- `backend/routers/`: FastAPI route handlers (auth, companies, kb, negotiations, revisions, compliance).
- `backend/services/`: Core business logic (Git tracking, FAISS indexing, Doc conversion, LLM analysis).
- `frontend/src/api/`: Typed Axios client wrappers.
- `/vectorstores/`: Contains `.faiss` and `.pkl` files for company knowledge bases.
- `/negotiations/`: Contains initialized Git repositories for each active contract deck.

By following these guidelines, you will ensure the platform remains stable, coherent, and aligned with the original vision. Good luck.
