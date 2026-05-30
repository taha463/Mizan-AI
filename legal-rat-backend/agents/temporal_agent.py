import re

class TemporalAgent:
    def __init__(self):
        # We use three distinct searchlights to catch all variations of time
        
        # 1. Absolute Time (e.g., 11:30 PM, 14:00 hours, 9:15a.m.)
        self.time_pattern = r"\b(?:[01]?\d|2[0-3])[:.][0-5]\d\s*(?:[aA]\.?[mM]\.?|[pP]\.?[mM]\.?|hours)?\b"
        
        # 2. Absolute Dates (e.g., 13.04.2020, 14th January 2024, 12/04/23)
        
        self.date_pattern = r"(?i)\b(\d{1,2} (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{4})\b"
        self.relative_pattern = r"(?i)\b(yesterday|today|tomorrow|last night)\b"

    def process_document(self, raw_text: str) -> str:
        """
        Scans the massive raw text string, extracts any paragraph containing 
        temporal markers, and compiles them for the Chief Justice.
        """
        extracted_timeline_events = []
        
        # Split the document by paragraphs, same as the Testimony Agent
        paragraphs = raw_text.split('\n\n')
        
        print(f"⏱️ Temporal Agent scanning {len(paragraphs)} text blocks for timelines...")

        for paragraph in paragraphs:
            clean_para = paragraph.strip()
            if not clean_para:
                continue
                
            # Check if the paragraph contains ANY of our time markers
            has_time = bool(re.search(self.time_pattern, clean_para))
            has_date = bool(re.search(self.date_pattern, clean_para))
            has_relative = bool(re.search(self.relative_pattern, clean_para))
            
            # If it has any temporal anchor, it belongs in the timeline evidence
            if has_time or has_date or has_relative:
                # We prefix it so the model knows this chunk was flagged for timing
                extracted_timeline_events.append(f"[TIMELINE DATA] {clean_para}")

        print(f"✅ Filtered down to {len(extracted_timeline_events)} timeline-relevant blocks.")
        
        return "\n\n".join(extracted_timeline_events)

# Instantiate the agent
temporal_agent = TemporalAgent()