import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.document import Document, REQUIRED_DOCS, DOC_LABELS
from app.models.team import Team
from app.models.user import User
from app.schemas.document import DocumentOut
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/documents", tags=["Documents"])

UPLOAD_DIR = "uploads"
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "application/pdf"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def _get_team(db: Session, user: User) -> Team:
    team = db.query(Team).filter(Team.leader_id == user.id).order_by(Team.created_at.desc()).first()
    if not team:
        raise HTTPException(status_code=404, detail="No team registration found. Please register a team first.")
    return team


@router.get("/required")
def get_required_docs():
    """Public: list of document types that must be uploaded."""
    return [{"type": k, "label": v} for k, v in DOC_LABELS.items()]


@router.post("/upload", response_model=DocumentOut)
async def upload_document(
    doc_type: str = Form(...),
    event_slug: str = Form(default=""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if doc_type not in REQUIRED_DOCS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid document type. Allowed: {', '.join(REQUIRED_DOCS)}"
        )

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF, JPG, and PNG files are accepted")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size must not exceed 5 MB")

    # Resolve team (optionally filter by event_slug)
    query = db.query(Team).filter(Team.leader_id == current_user.id)
    if event_slug:
        query = query.filter(Team.event_slug == event_slug)
    team = query.order_by(Team.created_at.desc()).first()
    if not team:
        raise HTTPException(status_code=404, detail="No team registration found")

    # Save file to disk
    team_dir = os.path.join(UPLOAD_DIR, str(team.id))
    os.makedirs(team_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "")[1].lower() or ".pdf"
    filename = f"{doc_type}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{ext}"
    file_path = os.path.join(team_dir, filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    # Upsert: replace existing doc of same type
    existing = db.query(Document).filter(
        Document.team_id == team.id,
        Document.doc_type == doc_type,
    ).first()

    if existing:
        if os.path.exists(existing.file_path):
            os.remove(existing.file_path)
        existing.file_path = file_path
        existing.original_filename = file.filename or filename
        existing.file_size = len(contents)
        existing.status = "pending"
        existing.reviewer_note = None
        existing.uploaded_at = datetime.utcnow()
        existing.reviewed_at = None
        db.commit()
        db.refresh(existing)
        return existing

    doc = Document(
        team_id=team.id,
        doc_type=doc_type,
        file_path=file_path,
        original_filename=file.filename or filename,
        file_size=len(contents),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/mine", response_model=list[DocumentOut])
def get_my_documents(
    event_slug: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Team).filter(Team.leader_id == current_user.id)
    if event_slug:
        query = query.filter(Team.event_slug == event_slug)
    team = query.order_by(Team.created_at.desc()).first()
    if not team:
        return []

    return db.query(Document).filter(Document.team_id == team.id).all()


@router.get("/{doc_id}/download")
def download_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    team = _get_team(db, current_user)
    doc = db.query(Document).filter(
        Document.id == doc_id,
        Document.team_id == team.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
    return FileResponse(
        doc.file_path,
        filename=doc.original_filename,
        media_type="application/octet-stream",
    )
