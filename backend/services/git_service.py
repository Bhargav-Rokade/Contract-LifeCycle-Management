import os
from pathlib import Path
from git import Repo, Actor
from backend.config import settings

class GitService:
    CONTRACT_FILENAME = "contract.md"
    
    @staticmethod
    def get_repo_path(deck_id: str) -> Path:
        return settings.NEGOTIATIONS_DIR / deck_id

    @staticmethod
    def init_repo(deck_id: str) -> Path:
        repo_path = GitService.get_repo_path(deck_id)
        repo_path.mkdir(parents=True, exist_ok=True)
        # Init empty git repo if not exists
        if not (repo_path / ".git").exists():
            Repo.init(repo_path)
            
        exports_dir = repo_path / "exports"
        exports_dir.mkdir(exist_ok=True)
        
        return repo_path

    @staticmethod
    def commit_revision(deck_id: str, md_content: str, author_company: str, commit_message: str) -> str:
        """
        Writes contract.md and creates a git commit. Returns commit hash.
        """
        repo_path = GitService.get_repo_path(deck_id)
        repo = Repo(repo_path)
        
        file_path = repo_path / GitService.CONTRACT_FILENAME
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(md_content)
            
        repo.index.add([GitService.CONTRACT_FILENAME])
        
        actor = Actor(author_company, f"{author_company}@contractplatform.local")
        commit = repo.index.commit(commit_message, author=actor, committer=actor)
        return commit.hexsha

    @staticmethod
    def get_log(deck_id: str) -> list[dict]:
        """
        Returns list of commits, newest first.
        """
        repo_path = GitService.get_repo_path(deck_id)
        if not (repo_path / ".git").exists():
            return []
            
        repo = Repo(repo_path)
        if not repo.head.is_valid():
            return []
            
        commits = []
        for commit in repo.iter_commits('HEAD'):
            commits.append({
                "hash": commit.hexsha,
                "author": commit.author.name,
                "message": commit.message.strip(),
                "date": commit.committed_datetime
            })
        return commits

    @staticmethod
    def get_diff(deck_id: str, commit_a: str, commit_b: str) -> str:
        """
        Gets unified diff between commit_a and commit_b.
        If commit_a is None (e.g. first commit), diffs against empty tree.
        """
        repo_path = GitService.get_repo_path(deck_id)
        repo = Repo(repo_path)
        
        if not commit_a:
            # Diff against empty tree
            tree_a = repo.tree('4b825dc642cb6eb9a060e54bf8d69288fbee4904') # Empty tree hash
            tree_b = repo.commit(commit_b).tree
        else:
            tree_a = repo.commit(commit_a).tree
            tree_b = repo.commit(commit_b).tree
            
        diff_text = repo.git.diff(tree_a, tree_b, GitService.CONTRACT_FILENAME, unified=3)
        return diff_text

    @staticmethod
    def get_content_at(deck_id: str, commit_hash: str) -> str:
        """
        Retrieves the exact markdown content of contract.md at a specific commit.
        """
        repo_path = GitService.get_repo_path(deck_id)
        repo = Repo(repo_path)
        
        commit = repo.commit(commit_hash)
        try:
            blob = commit.tree[GitService.CONTRACT_FILENAME]
            return blob.data_stream.read().decode('utf-8')
        except KeyError:
            return ""
