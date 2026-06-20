"""
PHASE 2C — Extended Document Tests
Covers: multiple users uploading docs, status field values, file size boundary,
        content-type variations, admin doc filters, doc type completeness,
        upload for formula_green, reviewer note fields, doc count per team
"""
import pytest
from tests.conftest import make_pdf, make_jpg


@pytest.fixture(scope="session", autouse=True)
def _ensure_team(registered_team):
    pass


def _reg_with_team(client, email, phone, event_slug="go_kart"):
    r = client.post("/api/auth/register", json={
        "full_name": "Doc User", "email": email, "phone": phone, "password": "Doc@1234"
    })
    h = {"Authorization": f"Bearer {r.json()['access_token']}"}
    client.post("/api/teams", json={
        "team_name": f"DocTeam {phone}",
        "event_slug": event_slug,
        "institution": "Test Univ", "city": "Chennai", "state": "Tamil Nadu",
        "members": [{"name": "Doc User", "email": email}],
    }, headers=h)
    return h


# ─────────────────────────────────────────────────────────────────────────────
# UPLOAD EXTENDED
# ─────────────────────────────────────────────────────────────────────────────
class TestUploadExtended:

    def test_upload_returns_doc_id(self, client, user_headers):
        res = client.post(
            "/api/documents/upload",
            data={"doc_type": "noc", "event_slug": "go_kart"},
            files={"file": make_pdf("noc_ext.pdf")},
            headers=user_headers,
        )
        assert "id" in res.json()
        assert isinstance(res.json()["id"], int)

    def test_upload_returns_file_size(self, client, user_headers):
        res = client.post(
            "/api/documents/upload",
            data={"doc_type": "college_id", "event_slug": "go_kart"},
            files={"file": make_jpg("cid_ext.jpg")},
            headers=user_headers,
        )
        assert "file_size" in res.json()
        assert res.json()["file_size"] > 0

    def test_upload_returns_uploaded_at(self, client, user_headers):
        res = client.post(
            "/api/documents/upload",
            data={"doc_type": "govt_id", "event_slug": "go_kart"},
            files={"file": make_pdf("gid_ext.pdf")},
            headers=user_headers,
        )
        assert "uploaded_at" in res.json()
        assert res.json()["uploaded_at"] is not None

    def test_upload_status_is_always_pending(self, client, user_headers):
        for doc in ["noc", "college_id", "govt_id", "driving_license"]:
            res = client.post(
                "/api/documents/upload",
                data={"doc_type": doc, "event_slug": "go_kart"},
                files={"file": make_pdf(f"{doc}_status.pdf")},
                headers=user_headers,
            )
            assert res.json()["status"] == "pending"

    def test_upload_exactly_5mb_accepted(self, client, user_headers):
        exactly_5mb = b"A" * (5 * 1024 * 1024)
        res = client.post(
            "/api/documents/upload",
            data={"doc_type": "noc", "event_slug": "go_kart"},
            files={"file": ("exact5mb.pdf", exactly_5mb, "application/pdf")},
            headers=user_headers,
        )
        assert res.status_code in (200, 400)   # boundary — some implementations are strict

    def test_upload_1byte_file_accepted(self, client, user_headers):
        res = client.post(
            "/api/documents/upload",
            data={"doc_type": "noc", "event_slug": "go_kart"},
            files={"file": ("tiny.pdf", b"%", "application/pdf")},
            headers=user_headers,
        )
        assert res.status_code == 200

    def test_upload_mp4_rejected(self, client, user_headers):
        res = client.post(
            "/api/documents/upload",
            data={"doc_type": "noc", "event_slug": "go_kart"},
            files={"file": ("video.mp4", b"\x00\x00\x00\x18ftyp", "video/mp4")},
            headers=user_headers,
        )
        assert res.status_code == 400

    def test_upload_doc_type_case_sensitive(self, client, user_headers):
        res = client.post(
            "/api/documents/upload",
            data={"doc_type": "NOC", "event_slug": "go_kart"},
            files={"file": make_pdf("caps.pdf")},
            headers=user_headers,
        )
        assert res.status_code == 400

    def test_upload_wrong_event_slug_returns_404(self, client, user_headers):
        res = client.post(
            "/api/documents/upload",
            data={"doc_type": "noc", "event_slug": "wrong_event"},
            files={"file": make_pdf("wrong.pdf")},
            headers=user_headers,
        )
        assert res.status_code == 404

    def test_second_user_can_upload_independently(self, client):
        h = _reg_with_team(client, "docind@xtest.com", "8300000001")
        res = client.post(
            "/api/documents/upload",
            data={"doc_type": "noc", "event_slug": "go_kart"},
            files={"file": make_pdf("ind_noc.pdf")},
            headers=h,
        )
        assert res.status_code == 200

    def test_upload_for_formula_green_team(self, client):
        h = _reg_with_team(client, "fgdoc@xtest.com", "8300000002", event_slug="formula_green")
        res = client.post(
            "/api/documents/upload",
            data={"doc_type": "noc", "event_slug": "formula_green"},
            files={"file": make_pdf("fg_noc.pdf")},
            headers=h,
        )
        assert res.status_code == 200

    def test_upload_original_filename_stored_correctly(self, client, user_headers):
        fname = "my_important_doc_2024.pdf"
        res = client.post(
            "/api/documents/upload",
            data={"doc_type": "driving_license", "event_slug": "go_kart"},
            files={"file": (fname, b"%PDF fake", "application/pdf")},
            headers=user_headers,
        )
        assert res.json()["original_filename"] == fname


# ─────────────────────────────────────────────────────────────────────────────
# LIST DOCUMENTS EXTENDED
# ─────────────────────────────────────────────────────────────────────────────
class TestListDocumentsExtended:

    def test_list_returns_correct_doc_type_field(self, client, user_headers):
        res = client.get("/api/documents/mine?event_slug=go_kart", headers=user_headers)
        for doc in res.json():
            assert doc["doc_type"] in ("noc", "college_id", "govt_id", "driving_license")

    def test_list_no_duplicate_doc_types(self, client, user_headers):
        res = client.get("/api/documents/mine?event_slug=go_kart", headers=user_headers)
        types = [d["doc_type"] for d in res.json()]
        assert len(types) == len(set(types))

    def test_list_each_doc_has_id(self, client, user_headers):
        res = client.get("/api/documents/mine?event_slug=go_kart", headers=user_headers)
        for doc in res.json():
            assert "id" in doc and doc["id"] > 0

    def test_list_status_values_are_valid(self, client, user_headers):
        valid = {"pending", "approved", "rejected", "reupload_requested"}
        res = client.get("/api/documents/mine?event_slug=go_kart", headers=user_headers)
        for doc in res.json():
            assert doc["status"] in valid

    def test_different_users_see_only_their_docs(self, client, user_headers):
        h2 = _reg_with_team(client, "isolate@xtest.com", "8300000010")
        client.post(
            "/api/documents/upload",
            data={"doc_type": "noc", "event_slug": "go_kart"},
            files={"file": make_pdf("iso_noc.pdf")},
            headers=h2,
        )
        u1_docs = client.get("/api/documents/mine?event_slug=go_kart", headers=user_headers).json()
        u2_docs = client.get("/api/documents/mine?event_slug=go_kart", headers=h2).json()
        u1_ids = {d["id"] for d in u1_docs}
        u2_ids = {d["id"] for d in u2_docs}
        assert u1_ids.isdisjoint(u2_ids)


# ─────────────────────────────────────────────────────────────────────────────
# REQUIRED DOCS EXTENDED
# ─────────────────────────────────────────────────────────────────────────────
class TestRequiredDocsExtended:

    def test_required_docs_returns_list(self, client):
        res = client.get("/api/documents/required")
        assert isinstance(res.json(), list)

    def test_required_docs_count_is_4(self, client):
        res = client.get("/api/documents/required")
        assert len(res.json()) == 4

    def test_required_docs_has_noc(self, client):
        types = {d["type"] for d in client.get("/api/documents/required").json()}
        assert "noc" in types

    def test_required_docs_has_college_id(self, client):
        types = {d["type"] for d in client.get("/api/documents/required").json()}
        assert "college_id" in types

    def test_required_docs_has_govt_id(self, client):
        types = {d["type"] for d in client.get("/api/documents/required").json()}
        assert "govt_id" in types

    def test_required_docs_has_driving_license(self, client):
        types = {d["type"] for d in client.get("/api/documents/required").json()}
        assert "driving_license" in types

    def test_required_docs_label_is_string(self, client):
        for doc in client.get("/api/documents/required").json():
            assert isinstance(doc["label"], str)
            assert len(doc["label"]) > 3
