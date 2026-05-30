import fitz

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        extracted_pages = []
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text("text")
            clean_text = " ".join(text.split())
            extracted_pages.append(f"[--- PAGE {page_num + 1} ---]\n{clean_text}")
        doc.close()
        full_document_text = "\n\n".join(extracted_pages)
        if len(full_document_text.strip()) < 50:
            raise ValueError("Document contains no extractable text.")
        return full_document_text
    except Exception as e:
        raise ValueError(f"Ingestion Engine Failure: {str(e)}")