from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from app.database import Base

REQUIRED_DOCS = ["noc", "college_id", "govt_id", "driving_license"]

DOC_LABELS = {
    "noc": "No Objection Certificate",
    "college_id": "College ID Card",
    "govt_id": "Government ID (Aadhaar / PAN / Passport)",
    "driving_license": "Valid Driving License",
}


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)

    doc_type = Column(String, nullable=False)          # one of REQUIRED_DOCS
    file_path = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)        # bytes

    # pending | approved | rejected
    status = Column(String, default="pending", nullable=False)
    reviewer_note = Column(Text, nullable=True)

    uploaded_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
