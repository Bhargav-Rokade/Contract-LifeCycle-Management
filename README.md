# Contract Intelligence Platform

This is a platform designed for organizations that frequently exchange and revise legal agreements. It provides a structured environment where two organizations can negotiate a contract, maintain an immutable Git-backed version history of revisions, and automatically evaluate contractual changes against their own internal policy knowledge base using AI.

## Key Features
- **Git-Backed Versioning**: Every negotiation is a local Git repository. Revisions are tracked as commits, allowing for precise clause-level diffing.
- **Markdown Source of Truth**: Upload `.docx` or `.pdf` files. They are automatically converted to Markdown for accurate processing, and can be exported back to `.docx`.
- **Viewpoint-Dependent Compliance Engine**: Uses local FAISS vector stores to retrieve *your* company's internal policies, and leverages OpenAI to analyze counterparty contract changes against your specific rules.
- **Formal Design System**: A custom-built, React+Vite frontend optimized for professional legal review.

---

## Prerequisites
- **Python 3.13+** (Required for the FastAPI backend)
- **Node.js 18+** (Required for the Vite/React frontend)
- **Pandoc** (Required for DOCX to Markdown conversion. Install via your OS package manager: e.g., `apt install pandoc`, `brew install pandoc`, or via the official Windows installer).
- **OpenAI API Key** (Required for embeddings and compliance analysis).

---

## Setup Instructions

### 1. Backend Setup
1. Open a terminal and navigate to the project root.
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # Windows
   .venv\Scripts\activate
   # Linux/Mac
   source .venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the project root (you can copy `.env.example`):
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   JWT_SECRET=your_secure_random_string_here
   ```

### 2. Frontend Setup
1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the Node dependencies:
   ```bash
   npm install
   ```

---

## Running the Application

You need to run both the backend and frontend servers simultaneously.

**Start the Backend Server (Terminal 1 - Project Root):**
```bash
python -m uvicorn backend.main:app --reload
```
The API will run at `http://localhost:8000`.

**Start the Frontend Server (Terminal 2 - frontend directory):**
```bash
npm run dev
```
The Web UI will be accessible at `http://localhost:5173`.

---

## How to Use

1. **Register Companies**: Open the frontend and register two different companies (e.g., "Buyer Corp" and "Vendor LLC").
2. **Build Knowledge Base**: Log into one company, go to **Knowledge Base**, and upload internal policy documents (PDF/DOCX). Click **Rebuild Index** to vectorize them.
3. **Start Negotiation**: Go to **Negotiations** and create a new deck by searching for the counterparty's handle.
4. **Upload Drafts**: Inside the negotiation deck, upload a `.docx` contract. 
5. **Analyze Compliance**: When a new revision is uploaded, click **Run Compliance Review** to let the AI compare the diffs against the reviewing company's knowledge base. Note that the AI Agent will not respond if there is no conflict after the update
6. **Export**: Export the latest state of the contract back to a `.docx` file for external offline editing.
