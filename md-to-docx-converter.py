import os
import pypandoc

def get_markdown_files(source_folder: str) -> list:
    """
    Description:
        Retrieves all Markdown (.md) files from the specified source folder.

    Input:
        source_folder (str): Path to the folder containing markdown files.

    Output:
        list: A list of full file paths (str) for all markdown files found.
    """
    markdown_files = [
        os.path.join(source_folder, file)
        for file in os.listdir(source_folder)
        if file.endswith(".md")
    ]
    return markdown_files


def convert_markdown_to_docx(source_file: str, destination_file: str) -> None:
    """
    Description:
        Converts a Markdown file to a DOCX file using pypandoc.

    Input:
        source_file (str): Full path of the markdown (.md) file to convert.
        destination_file (str): Full path where the converted .docx file will be saved.

    Output:
        None
    """
    pypandoc.convert_file(source_file, 'docx', outputfile=destination_file)


def process_folder(source_folder: str, destination_folder: str) -> None:
    """
    Description:
        Converts all markdown files in the source folder to DOCX format
        and saves them in the destination folder.

    Input:
        source_folder (str): Path to the folder containing markdown files.
        destination_folder (str): Path where converted docx files will be stored.

    Output:
        None
    """
    if not os.path.exists(destination_folder):
        os.makedirs(destination_folder)

    md_files = get_markdown_files(source_folder)

    for md_file in md_files:
        filename = os.path.splitext(os.path.basename(md_file))[0] + ".docx"
        destination_path = os.path.join(destination_folder, filename)
        convert_markdown_to_docx(md_file, destination_path)


def main():
    """
    Description:
        Entry point for the Markdown-to-DOCX conversion script. Prompts the user
        for input and output folder paths, and initiates conversion.

    Input:
        None (User input from terminal)

    Output:
        None
    """
    source_folder = "docs_md_formatted"
    destination_folder = "docs_word_formatted"

    process_folder(source_folder, destination_folder)
    print(f"✅ Conversion completed. DOCX files saved in: {destination_folder}")


if __name__ == "__main__":
    main()
