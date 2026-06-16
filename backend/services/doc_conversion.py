import os
import pypandoc
import fitz  # PyMuPDF

class DocConversionService:
    @staticmethod
    def convert_to_markdown(file_path: str, file_type: str) -> str:
        """
        Converts a given file to Markdown text.
        Supported file_type: 'docx', 'pdf', 'txt'
        """
        if file_type == 'docx':
            return pypandoc.convert_file(file_path, to='markdown', format='docx')
        elif file_type == 'pdf':
            doc = fitz.open(file_path)
            md_text = ""
            for page in doc:
                md_text += page.get_text("text") + "\n\n"
            return md_text
        elif file_type == 'txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        elif file_type == 'md':
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()

        else:
            raise ValueError(f"Unsupported file type: {file_type}")

    @staticmethod
    def convert_markdown_to_docx(md_content: str, output_path: str) -> None:
        """
        Converts Markdown text back to a DOCX file and saves it to output_path.
        """
        pypandoc.convert_text(md_content, to='docx', format='markdown', outputfile=output_path)
