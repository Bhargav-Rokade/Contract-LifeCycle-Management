import os
import pickle
import numpy as np
import faiss
from typing import List, Dict, Tuple
from openai import AsyncOpenAI
from backend.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

class EmbeddingService:
    EMBEDDING_MODEL = "text-embedding-3-large"
    CHUNK_SIZE = 500  # approximate words
    CHUNK_OVERLAP = 50

    @staticmethod
    def chunk_text(text: str, source_file: str) -> List[Dict]:
        """
        Splits text into chunks by paragraphs, trying to keep chunks around CHUNK_SIZE words.
        Returns a list of dicts with chunk metadata.
        """
        paragraphs = text.split('\n\n')
        chunks = []
        current_chunk = []
        current_length = 0

        for p in paragraphs:
            words = p.split()
            if not words:
                continue
            
            # If a single paragraph is too large, we just add it and it'll be a slightly larger chunk.
            # Real-world chunking often uses LangChain's RecursiveCharacterTextSplitter, 
            # but this is a lightweight approach.
            if current_length + len(words) > EmbeddingService.CHUNK_SIZE and current_chunk:
                chunk_text = "\n\n".join(current_chunk)
                chunks.append({
                    "text": chunk_text,
                    "source_file": source_file
                })
                # Keep overlap (last paragraph or so)
                overlap_words_count = 0
                overlap_chunk = []
                for prev_p in reversed(current_chunk):
                    prev_words = prev_p.split()
                    if overlap_words_count + len(prev_words) > EmbeddingService.CHUNK_OVERLAP:
                        break
                    overlap_chunk.insert(0, prev_p)
                    overlap_words_count += len(prev_words)
                
                current_chunk = overlap_chunk
                current_length = overlap_words_count
            
            current_chunk.append(p)
            current_length += len(words)

        if current_chunk:
            chunk_text = "\n\n".join(current_chunk)
            chunks.append({
                "text": chunk_text,
                "source_file": source_file
            })

        return chunks

    @staticmethod
    async def generate_embeddings(texts: List[str]) -> np.ndarray:
        """
        Calls OpenAI to generate embeddings for a list of texts.
        """
        if not texts:
            return np.array([])
            
        response = await client.embeddings.create(
            input=texts,
            model=EmbeddingService.EMBEDDING_MODEL
        )
        
        embeddings = [data.embedding for data in response.data]
        vectors = np.array(embeddings).astype('float32')
        # L2 normalize vectors for cosine similarity via inner product
        faiss.normalize_L2(vectors)
        return vectors

    @staticmethod
    async def build_and_save_index(company_handle: str, chunks: List[Dict]):
        """
        Builds a FAISS index from chunks and saves it to disk.
        """
        index_dir = settings.VECTORSTORES_DIR / company_handle
        index_dir.mkdir(parents=True, exist_ok=True)
        
        index_path = index_dir / "index.faiss"
        meta_path = index_dir / "metadata.pkl"
        
        if not chunks:
            # If empty KB, clear index if exists
            if index_path.exists():
                os.remove(index_path)
            if meta_path.exists():
                os.remove(meta_path)
            return

        texts = [c['text'] for c in chunks]
        vectors = await EmbeddingService.generate_embeddings(texts)
        
        dimension = vectors.shape[1]
        index = faiss.IndexFlatIP(dimension)
        index.add(vectors)
        
        faiss.write_index(index, str(index_path))
        with open(meta_path, 'wb') as f:
            pickle.dump(chunks, f)

    @staticmethod
    async def retrieve_top_k(company_handle: str, query: str, k: int = 5) -> List[Dict]:
        """
        Retrieves top k chunks for a query from the company's FAISS index.
        """
        index_dir = settings.VECTORSTORES_DIR / company_handle
        index_path = index_dir / "index.faiss"
        meta_path = index_dir / "metadata.pkl"
        
        if not index_path.exists() or not meta_path.exists():
            return []
            
        index = faiss.read_index(str(index_path))
        with open(meta_path, 'rb') as f:
            metadata = pickle.load(f)
            
        query_vector = await EmbeddingService.generate_embeddings([query])
        
        # Search
        distances, indices = index.search(query_vector, k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx != -1 and idx < len(metadata):
                res = metadata[idx].copy()
                res['score'] = float(distances[0][i])
                results.append(res)
                
        return results
