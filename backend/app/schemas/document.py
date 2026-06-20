from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DocumentOut(BaseModel):
    id: int
    team_id: int
    doc_type: str
    original_filename: str
    file_size: int
    status: str
    reviewer_note: Optional[str] = None
    uploaded_at: datetime
    reviewed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
