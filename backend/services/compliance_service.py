import json
from typing import List, Dict
from openai import AsyncOpenAI

from backend.config import settings
from backend.services.embedding_service import EmbeddingService

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

class ComplianceService:
    LLM_MODEL = "gpt-5-nano"

    @staticmethod
    def parse_diff_into_clauses(diff_text: str) -> List[Dict[str, str]]:
        """
        Parses a unified diff and extracts blocks of changed text as clauses.
        Returns a list of dicts with 'old' and 'new' clause representations.
        This is a simplistic parser suitable for markdown diffs.
        """
        clauses = []
        current_old = []
        current_new = []
        in_hunk = False

        for line in diff_text.split('\n'):
            if line.startswith('@@'):
                if current_old or current_new:
                    clauses.append({
                        "old": "\n".join(current_old).strip(),
                        "new": "\n".join(current_new).strip()
                    })
                    current_old = []
                    current_new = []
                in_hunk = True
                continue
            
            if not in_hunk:
                continue
                
            if line.startswith('-') and not line.startswith('---'):
                current_old.append(line[1:])
            elif line.startswith('+') and not line.startswith('+++'):
                current_new.append(line[1:])
            elif line.startswith(' '):
                # Context line: if we had pending changes, treat context as a separator
                if current_old or current_new:
                    clauses.append({
                        "old": "\n".join(current_old).strip(),
                        "new": "\n".join(current_new).strip()
                    })
                    current_old = []
                    current_new = []

        if current_old or current_new:
            clauses.append({
                "old": "\n".join(current_old).strip(),
                "new": "\n".join(current_new).strip()
            })

        # Filter out trivial whitespace/empty changes
        filtered = []
        for c in clauses:
            if c['old'] != c['new'] and (c['old'] or c['new']):
                filtered.append(c)
                
        return filtered

    @staticmethod
    async def analyze_clause(company_handle: str, old_text: str, new_text: str) -> Dict | None:
        """
        Runs RAG over the company's knowledge base and calls LLM to evaluate the clause.
        Returns a structured dictionary or None if no significant finding.
        """
        query_text = f"Removed text: {old_text}\nAdded text: {new_text}"
        
        # Retrieve top 5 policy chunks
        retrieved = await EmbeddingService.retrieve_top_k(company_handle, query_text, k=5)
        
        if not retrieved:
            # If knowledge base is empty or missing, we can't do viewpoint-dependent compliance
            return None

        # Build context prompt
        policy_context = ""
        for idx, chunk in enumerate(retrieved):
            policy_context += f"--- Policy Excerpt {idx+1} (Source: {chunk['source_file']}) ---\n"
            policy_context += chunk['text'] + "\n\n"

        system_prompt = (
            "You are a contract compliance assistant reviewing contractual changes for your company.\n"
            "You must determine if the changed clause conflicts with your company's internal policies.\n"
            "Respond in JSON format with the following keys:\n"
            "- finding_type: must be one of ['potential_conflict', 'policy_alignment', 'manual_review_recommended', 'no_finding']\n"
            "- summary: A clear explanation of your reasoning based on the policy.\n"
            "- policy_reference: The exact source file name you are citing.\n"
            "- policy_excerpt: The specific quote from the policy that applies.\n"
            "If the change does not relate to any of the provided policies, return finding_type 'no_finding'."
        )

        user_prompt = (
            f"Review the following contract clause change:\n\n"
            f"Original Clause:\n{old_text}\n\n"
            f"New Clause:\n{new_text}\n\n"
            f"Relevant Company Policies:\n{policy_context}\n\n"
            "Provide your compliance finding in JSON format."
        )

        try:
            response = await client.chat.completions.create(
                model=ComplianceService.LLM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            result_text = response.choices[0].message.content
            finding = json.loads(result_text)
            
            if finding.get('finding_type') == 'no_finding':
                return None
                
            return finding
            
        except Exception as e:
            print(f"LLM Compliance Analysis Error: {e}")
            return None

    @staticmethod
    async def review_revision(company_handle: str, diff_text: str) -> List[Dict]:
        """
        Takes a diff, extracts clauses, and runs compliance analysis on each.
        """
        clauses = ComplianceService.parse_diff_into_clauses(diff_text)
        findings = []
        
        for c in clauses:
            finding = await ComplianceService.analyze_clause(company_handle, c['old'], c['new'])
            if finding:
                # Attach the clause text that triggered it
                finding['clause_text'] = c['new'] if c['new'] else c['old']
                findings.append(finding)
                
        return findings
