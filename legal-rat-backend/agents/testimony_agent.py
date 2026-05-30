import re

class TestimonyAgent:
    def __init__(self):
        # Universal regex patterns to capture any variation of witness labeling or swearing-in terms
        self.target_patterns = [
            r"(?i)(PW-\d+|DW-\d+|Witness\s*\d+)", 
            r"(?i)(deposed|testified|stated\s*under\s*oath|cross-examined|examined\s*by)"
        ]

    def process_document(self, raw_text: str) -> str:
        """
        Takes the massive raw text string, scans every paragraph, 
        filters out the non-testimony text, and returns a compiled 
        evidence string ready for the Chief Justice.
        """
        extracted_testimonies = []
        
        # Split the massive document into distinct paragraphs
        paragraphs = raw_text.split('\n\n')
        
        print(f"🕵️ Testimony Agent scanning {len(paragraphs)} text blocks...")

        for paragraph in paragraphs:
            # We clean the paragraph to ensure trailing/leading spaces don't break regex
            clean_para = paragraph.strip()
            if not clean_para:
                continue
                
            # Check if ANY of our universal witness patterns match this paragraph
            is_testimony = False
            for pattern in self.target_patterns:
                if re.search(pattern, clean_para):
                    is_testimony = True
                    break # Pattern found, no need to check the remaining patterns for this paragraph
            
            # If it's a valid testimony block, store it
            if is_testimony:
                extracted_testimonies.append(clean_para)

        print(f"✅ Filtered down to {len(extracted_testimonies)} core testimony blocks.")
        
        # Join the filtered paragraphs back into a clean string for the model
        return "\n\n".join(extracted_testimonies)

# Instantiate the agent so it can be imported elsewhere in the project
testimony_agent = TestimonyAgent()