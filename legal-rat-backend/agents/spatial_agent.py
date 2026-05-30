import re

class SpatialAgent:
    def __init__(self):
        # We use four distinct searchlights to map the physical reality of the case
        
        # 1. Common Locations & Structures
        self.location_pattern = r"(?i)\b(gate|door|house|street|market|room|building|plot|village|town)\b"
        
        # 2. Direction & Movement (FIXED)
        self.direction_pattern = r"(?i)\b(?:north|south|east|west|fled|ran towards|approached|entered|exited|left|arrived)\b"
        
        # 3. Spatial Positioning (Relative locations) (FIXED)
        self.position_pattern = r"(?i)\b(?:inside|outside|next to|standing over|underneath|behind|in front of|adjacent to)\b"
        
        # 4. Common Physical Objects/Evidence (FIXED)
        self.object_pattern = r"(?i)\b(?:weapon|gun|knife|vehicle|car|motorcycle|clothing|shawl|coat|blood|glass|floodlight)\b"

    def process_document(self, raw_text: str) -> str:
        """
        Scans the massive raw text string, extracts any paragraph containing 
        spatial, directional, or physical anchors, and compiles them.
        """
        extracted_spatial_events = []
        
        paragraphs = raw_text.split('\n\n')
        
        print(f"🗺️ Spatial Agent mapping {len(paragraphs)} text blocks...")

        for paragraph in paragraphs:
            clean_para = paragraph.strip()
            if not clean_para:
                continue
                
            # Check if the paragraph contains ANY of our spatial anchors
            has_location = bool(re.search(self.location_pattern, clean_para))
            has_direction = bool(re.search(self.direction_pattern, clean_para))
            has_position = bool(re.search(self.position_pattern, clean_para))
            has_object = bool(re.search(self.object_pattern, clean_para))
            
            # If it has any physical or spatial relevance, save it
            if has_location or has_direction or has_position or has_object:
                # We prefix it so the model knows this chunk was flagged for spatial data
                extracted_spatial_events.append(f"[SPATIAL DATA] {clean_para}")

        print(f"✅ Filtered down to {len(extracted_spatial_events)} physical/spatial blocks.")
        
        return "\n\n".join(extracted_spatial_events)

# Instantiate the agent
spatial_agent = SpatialAgent()