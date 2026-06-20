"""
PHASE 1C — Document Upload Tests
Covers: upload (PDF/JPG), validation (type/size/doc_type), upsert, list, required docs
"""
import pytest
from tests.conftest import make_pdf, make_jpg


# Ensure the shared test user has a go_kart team before any doc test runs.
# Required when this phase is executed standalone (fresh DB each session).
@pytest.fixture(scope="session", autouse=True)
def _ensure_team(registered_team):
    pass


# ─────────────────────────────────────────────────────────────────────────────
# UPLOAD
# ─────────────────────────────────────────────────────────────────────────────
class TestDocumentUpload:

    def test_upload_noc_pdf_success(self, client, user_headers):
        res = client.post(
            "/api/documents/upload",
            data={"doc_type": "noc", "event_slug": "go_kart"},
            files={"file": make_pdf("noc.pdf")},
            headers=user_headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["doc_type"] == "noc"
        assert data["status"] == "pending"
        assert data["original_filename"] == "noc.pdf"

    def test_upload_college_id_jpg(self, client, user_headers):
        res = client.post(
            "/api/documents/upload",
            data={"doc_type": "college_id", "event_slug": "go_kart"},
            files={"file": make_jpg("college_id.jpg")},
            headers=user_headers,
        )
        assert res.status_code == 200
        assert res.json()["doc_type"] == "college_id"
        assert res.json()["status"] == "pending"

    def test_upload_govt_id_pdf(self, client, user_headers):
        res = client.post(
            "/api/documents/upload",
            data={"doc_type": "govt_id", "event_slug": "go_kart"},
            files={"file": make_pdf("govt_id.pdf")},
            headers=user_headers,
        )
        assert res.status_code == 200
        assert res.json()["doc_type"] == "govt_id"

    def test_upload_driving_license_pdf(self, client, user_headers):
        res = client.post(
            "/api/documents/upload",
            data={"doc_type": "driving_license", "event_slug": "go_kart"},
            files={"file": make_pdf("dl.pdf")},
            headers=user_headers,
        )
        assert res.status_code == 200
        assert res.json()["doc_type"] == "driving_license"

    def test_upload_invalid_doc_type(self, client, user_headers):
        res = client.post(
            "/api/documents/upload",
            data={"doc_type": "birth_certificate", "event_slug": "go_kart"},
            files={"file": make_pdf("birth.pdf")},
            headers=user_headers,
        )
        assert res.status_code == 400
        assert "Invalid document type" in res.json()["detail"]

    def test_upload_invalid_file_type_exe(self, client, user_headers):
        res = client.post(
            "/api/documents/upload",
            data={"doc_type": "noc", "event_slug": "go_kart"},
            files={"file": ("virus.exe", b"MZ\x90\x00fake exe", "application/octet-stream")},
            headers=user_headers,
        )
        assert res.status_code == 400
        assert "PDF, JPG" in res.json()["detail"]

    def test_upload_invalid_file_type_gif(self, client, user_headers):
        res = client.post(
            "/api/documents/upload",
            data={"doc_type": "noc", "event_slug": "go_kart"},
            files={"file": ("image.gif", b"GIF89a fake", "image/gif")},
            headers=user_headers,
        )
        assert res.status_code == 400

    def test_upload_file_too_large(self, client, user_headers):
        big = b"A" * (6 * 1024 * 1024)   # 6 MB > 5 MB limit
        res = client.post(
            "/api/documents/upload",
            data={"doc_type": "noc", "event_slug": "go_kart"},
            files={"file": ("big.pdf", big, "application/pdf")},
            headers=user_headers,
        )
        assert res.status_code == 400
        assert "5 MB" in res.json()["detail"]

    def test_upload_unauthenticated(self, client):
        res = client.post(
            "/api/documents/upload",
            data={"doc_type": "noc", "event_slug": "go_kart"},
            files={"file": make_pdf("noc.pdf")},
        )
        assert res.status_code in (401, 403)

    def test_upload_no_team_returns_404(self, client):
        reg = client.post("/api/auth/register", json={
            "full_name": "No Team Doc",
            "email": "noteamdoc@xtest.com",
            "phone": "9500000001",
            "password": "Note@1234",
        })
        h = {"Authorization": f"Bearer {reg.json()['access_token']}"}
        res = client.post(
            "/api/documents/upload",
            data={"doc_type": "noc", "event_slug": "go_kart"},
            files={"file": make_pdf("noc.pdf")},
            headers=h,
        )
        assert res.status_code == 404


# ─────────────────────────────────────────────────────────────────────────────
# UPSERT (re-upload replaces existing)
# ─────────────────────────────────────────────────────────────────────────────
class TestDocumentUpsert:

    def test_re_upload_replaces_file(self, client, user_headers):
        # First upload
        client.post(
            "/api/documents/upload",
            data={"doc_type": "noc", "event_slug": "go_kart"},
            files={"file": make_pdf("noc_v1.pdf")},
            headers=user_headers,
        )
        # Second upload same type
        res = client.post(
            "/api/documents/upload",
            data={"doc_type": "noc", "event_slug": "go_kart"},
            files={"file": make_pdf("noc_v2.pdf")},
            headers=user_headers,
        )
        assert res.status_code == 200
        assert res.json()["original_filename"] == "noc_v2.pdf"

    def test_re_upload_resets_status_to_pending(self, client, user_headers):
        # Upload, then re-upload — status must be reset to "pending"
        client.post(
            "/api/documents/upload",
            data={"doc_type": "noc", "event_slug": "go_kart"},
            files={"file": make_pdf("noc_a.pdf")},
            headers=user_headers,
        )
        res = client.post(
            "/api/documents/upload",
            data={"doc_type": "noc", "event_slug": "go_kart"},
            files={"file": make_pdf("noc_b.pdf")},
            headers=user_headers,
        )
        assert res.json()["status"] == "pending"

    def test_re_upload_does_not_create_duplicate_record(self, client, user_headers):
        # Upload noc twice — list should have only ONE noc entry
        for v in ["v3", "v4"]:
            client.post(
                "/api/documents/upload",
                data={"doc_type": "noc", "event_slug": "go_kart"},
                files={"file": make_pdf(f"noc_{v}.pdf")},
                headers=user_headers,
            )
        docs = client.get("/api/documents/mine?event_slug=go_kart", headers=user_headers).json()
        noc_entries = [d for d in docs if d["doc_type"] == "noc"]
        assert len(noc_entries) == 1


# ─────────────────────────────────────────────────────────────────────────────
# LIST MY DOCUMENTS
# ─────────────────────────────────────────────────────────────────────────────
class TestListDocuments:

    def test_list_my_docs_returns_list(self, client, user_headers):
        res = client.get("/api/documents/mine?event_slug=go_kart", headers=user_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_list_my_docs_has_expected_fields(self, client, user_headers):
        res = client.get("/api/documents/mine?event_slug=go_kart", headers=user_headers)
        docs = res.json()
        assert len(docs) >= 1
        doc = docs[0]
        for field in ("id", "doc_type", "original_filename", "file_size", "status", "uploaded_at"):
            assert field in doc

    def test_list_returns_all_4_uploaded_docs(self, client, user_headers):
        res = client.get("/api/documents/mine?event_slug=go_kart", headers=user_headers)
        types = {d["doc_type"] for d in res.json()}
        # All 4 uploaded in TestDocumentUpload
        assert "noc" in types
        assert "college_id" in types
        assert "govt_id" in types
        assert "driving_license" in types

    def test_list_docs_unauthenticated(self, client):
        res = client.get("/api/documents/mine?event_slug=go_kart")
        assert res.status_code in (401, 403)

    def test_list_docs_empty_for_team_with_no_uploads(self, client):
        reg = client.post("/api/auth/register", json={
            "full_name": "Clean Slate",
            "email": "cleanslate@xtest.com",
            "phone": "9500000002",
            "password": "Clean@1234",
        })
        h = {"Authorization": f"Bearer {reg.json()['access_token']}"}
        client.post("/api/teams", json={
            "team_name": "Clean Team",
            "event_slug": "go_kart",
            "institution": "Test Univ",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "members": [{"name": "Clean Slate", "email": "cleanslate@xtest.com"}],
        }, headers=h)
        res = client.get("/api/documents/mine?event_slug=go_kart", headers=h)
        assert res.status_code == 200
        assert res.json() == []


# ─────────────────────────────────────────────────────────────────────────────
# REQUIRED DOCS (PUBLIC)
# ─────────────────────────────────────────────────────────────────────────────
class TestRequiredDocsList:

    def test_required_docs_no_auth_needed(self, client):
        res = client.get("/api/documents/required")
        assert res.status_code == 200

    def test_required_docs_has_all_4_types(self, client):
        res = client.get("/api/documents/required")
        types = {d["type"] for d in res.json()}
        assert types == {"noc", "college_id", "govt_id", "driving_license"}

    def test_required_docs_has_labels(self, client):
        res = client.get("/api/documents/required")
        for doc in res.json():
            assert "type" in doc
            assert "label" in doc
            assert len(doc["label"]) > 0
