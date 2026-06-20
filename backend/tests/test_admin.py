"""
Admin Backend Tests
Covers: role guard, stats, teams CRUD, doc review, payments, notifications, CSV export
"""
import pytest
from tests.conftest import make_pdf


# Ensure the shared test user has a go_kart team before any admin test runs.
# Required when this phase is executed standalone (fresh DB each session).
@pytest.fixture(scope="session", autouse=True)
def _ensure_team(registered_team):
    pass


# ─────────────────────────────────────────────────────────────────────────────
# ROLE GUARD — non-admin must be blocked
# ─────────────────────────────────────────────────────────────────────────────
class TestRoleGuard:

    def test_regular_user_cannot_access_stats(self, client, user_headers):
        res = client.get("/api/admin/stats", headers=user_headers)
        assert res.status_code == 403

    def test_unauthenticated_cannot_access_stats(self, client):
        res = client.get("/api/admin/stats")
        assert res.status_code in (401, 403)

    def test_regular_user_cannot_list_admin_teams(self, client, user_headers):
        res = client.get("/api/admin/teams", headers=user_headers)
        assert res.status_code == 403

    def test_regular_user_cannot_review_docs(self, client, user_headers):
        res = client.put("/api/admin/documents/1/review",
                         json={"status": "approved"}, headers=user_headers)
        assert res.status_code == 403

    def test_admin_can_access_all_admin_endpoints(self, client, admin_headers):
        assert client.get("/api/admin/stats",    headers=admin_headers).status_code == 200
        assert client.get("/api/admin/teams",    headers=admin_headers).status_code == 200
        assert client.get("/api/admin/documents",headers=admin_headers).status_code == 200
        assert client.get("/api/admin/payments", headers=admin_headers).status_code == 200


# ─────────────────────────────────────────────────────────────────────────────
# STATS
# ─────────────────────────────────────────────────────────────────────────────
class TestAdminStats:

    def test_stats_returns_correct_structure(self, client, admin_headers):
        res = client.get("/api/admin/stats", headers=admin_headers)
        assert res.status_code == 200
        data = res.json()
        assert "total_teams" in data
        assert "by_event" in data
        assert "by_status" in data
        assert "documents" in data
        assert "payments" in data

    def test_stats_by_event_has_both_slugs(self, client, admin_headers):
        data = client.get("/api/admin/stats", headers=admin_headers).json()
        assert "go_kart" in data["by_event"]
        assert "formula_green" in data["by_event"]

    def test_stats_by_status_has_all_statuses(self, client, admin_headers):
        data = client.get("/api/admin/stats", headers=admin_headers).json()
        for status in ("submitted", "approved", "rejected", "waitlisted"):
            assert status in data["by_status"]

    def test_stats_documents_has_pending_approved_rejected(self, client, admin_headers):
        data = client.get("/api/admin/stats", headers=admin_headers).json()
        for key in ("pending", "approved", "rejected"):
            assert key in data["documents"]

    def test_stats_reflects_at_least_one_team(self, client, admin_headers):
        data = client.get("/api/admin/stats", headers=admin_headers).json()
        assert data["total_teams"] >= 1
        assert data["by_event"]["go_kart"] >= 1

    def test_stats_payments_has_count_and_amount(self, client, admin_headers):
        data = client.get("/api/admin/stats", headers=admin_headers).json()
        assert "paid_count" in data["payments"]
        assert "total_amount_inr" in data["payments"]


# ─────────────────────────────────────────────────────────────────────────────
# TEAMS
# ─────────────────────────────────────────────────────────────────────────────
class TestAdminTeams:

    def _first_team_id(self, client, admin_headers):
        teams = client.get("/api/admin/teams", headers=admin_headers).json()["teams"]
        if not teams:
            pytest.skip("No teams in DB")
        return teams[0]["id"]

    def test_list_teams_returns_total_and_list(self, client, admin_headers):
        res = client.get("/api/admin/teams", headers=admin_headers)
        assert res.status_code == 200
        assert "total" in res.json()
        assert "teams" in res.json()
        assert isinstance(res.json()["teams"], list)

    def test_list_teams_has_expected_fields(self, client, admin_headers):
        res = client.get("/api/admin/teams", headers=admin_headers)
        team = res.json()["teams"][0]
        for f in ("id","registration_id","team_name","event_slug","status","member_count","payment_status"):
            assert f in team

    def test_search_by_name(self, client, admin_headers):
        res = client.get("/api/admin/teams?q=Thunder", headers=admin_headers)
        assert res.status_code == 200
        for t in res.json()["teams"]:
            assert "thunder" in t["team_name"].lower() or "partial" in t["team_name"].lower()

    def test_filter_by_event_go_kart(self, client, admin_headers):
        res = client.get("/api/admin/teams?event_slug=go_kart", headers=admin_headers)
        for t in res.json()["teams"]:
            assert t["event_slug"] == "go_kart"

    def test_filter_by_status_submitted(self, client, admin_headers):
        res = client.get("/api/admin/teams?status=submitted", headers=admin_headers)
        for t in res.json()["teams"]:
            assert t["status"] == "submitted"

    def test_pagination_limit(self, client, admin_headers):
        res = client.get("/api/admin/teams?limit=1", headers=admin_headers)
        assert len(res.json()["teams"]) <= 1

    def test_get_team_detail_structure(self, client, admin_headers):
        team_id = self._first_team_id(client, admin_headers)
        res = client.get(f"/api/admin/teams/{team_id}", headers=admin_headers)
        assert res.status_code == 200
        data = res.json()
        for f in ("registration_id","team_name","institution","leader","members","documents"):
            assert f in data
        assert "email" in data["leader"]

    def test_get_team_detail_not_found(self, client, admin_headers):
        res = client.get("/api/admin/teams/999999", headers=admin_headers)
        assert res.status_code == 404

    def test_update_status_to_under_review(self, client, admin_headers):
        team_id = self._first_team_id(client, admin_headers)
        res = client.put(f"/api/admin/teams/{team_id}/status",
                         json={"status": "under_review"}, headers=admin_headers)
        assert res.status_code == 200
        assert res.json()["status"] == "under_review"

    def test_update_status_to_approved(self, client, admin_headers):
        team_id = self._first_team_id(client, admin_headers)
        res = client.put(f"/api/admin/teams/{team_id}/status",
                         json={"status": "approved", "note": "All docs verified"},
                         headers=admin_headers)
        assert res.status_code == 200
        assert res.json()["status"] == "approved"

    def test_update_status_to_rejected_with_note(self, client, admin_headers):
        team_id = self._first_team_id(client, admin_headers)
        res = client.put(f"/api/admin/teams/{team_id}/status",
                         json={"status": "rejected", "note": "Ineligible institution"},
                         headers=admin_headers)
        assert res.status_code == 200
        assert res.json()["status"] == "rejected"

    def test_update_status_to_waitlisted(self, client, admin_headers):
        team_id = self._first_team_id(client, admin_headers)
        res = client.put(f"/api/admin/teams/{team_id}/status",
                         json={"status": "waitlisted"}, headers=admin_headers)
        assert res.status_code == 200

    def test_update_invalid_status_rejected(self, client, admin_headers):
        team_id = self._first_team_id(client, admin_headers)
        res = client.put(f"/api/admin/teams/{team_id}/status",
                         json={"status": "flying_cars"}, headers=admin_headers)
        assert res.status_code == 400

    def test_send_message_to_team(self, client, admin_headers):
        team_id = self._first_team_id(client, admin_headers)
        res = client.post(f"/api/admin/teams/{team_id}/message",
                          json={"subject": "Race Day Info", "message": "Please arrive by 8 AM."},
                          headers=admin_headers)
        assert res.status_code == 200
        assert "Message sent" in res.json()["message"]

    def test_send_message_empty_subject_fails(self, client, admin_headers):
        team_id = self._first_team_id(client, admin_headers)
        res = client.post(f"/api/admin/teams/{team_id}/message",
                          json={"subject": "", "message": "Hello"},
                          headers=admin_headers)
        assert res.status_code == 400

    def test_send_message_empty_body_fails(self, client, admin_headers):
        team_id = self._first_team_id(client, admin_headers)
        res = client.post(f"/api/admin/teams/{team_id}/message",
                          json={"subject": "Hi", "message": ""},
                          headers=admin_headers)
        assert res.status_code == 400

    def test_export_teams_csv(self, client, admin_headers):
        res = client.get("/api/admin/teams/export", headers=admin_headers)
        assert res.status_code == 200
        assert "text/csv" in res.headers["content-type"]
        lines = res.text.strip().split("\n")
        assert len(lines) >= 2                        # header + at least one row
        assert "Registration ID" in lines[0]
        assert "Team Name" in lines[0]

    def test_export_csv_filtered_by_event(self, client, admin_headers):
        res = client.get("/api/admin/teams/export?event_slug=go_kart", headers=admin_headers)
        assert res.status_code == 200
        assert "text/csv" in res.headers["content-type"]


# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENTS
# ─────────────────────────────────────────────────────────────────────────────
class TestAdminDocuments:

    def test_list_documents_returns_structure(self, client, admin_headers):
        res = client.get("/api/admin/documents", headers=admin_headers)
        assert res.status_code == 200
        data = res.json()
        assert "total" in data
        assert "documents" in data

    def test_list_documents_has_expected_fields(self, client, admin_headers):
        docs = client.get("/api/admin/documents", headers=admin_headers).json()["documents"]
        if docs:
            doc = docs[0]
            for f in ("id","team_name","registration_id","doc_type","label","status","uploaded_at"):
                assert f in doc

    def test_list_documents_filter_pending(self, client, admin_headers, user_headers):
        # Ensure at least one pending doc exists
        client.post(
            "/api/documents/upload",
            data={"doc_type": "noc", "event_slug": "go_kart"},
            files={"file": make_pdf("noc_fresh.pdf")},
            headers=user_headers,
        )
        res = client.get("/api/admin/documents?status=pending", headers=admin_headers)
        for doc in res.json()["documents"]:
            assert doc["status"] == "pending"

    def test_review_approve_document(self, client, admin_headers, user_headers):
        # Upload a fresh doc and approve it
        client.post(
            "/api/documents/upload",
            data={"doc_type": "college_id", "event_slug": "go_kart"},
            files={"file": make_pdf("college_fresh.pdf")},
            headers=user_headers,
        )
        docs = client.get("/api/admin/documents?status=pending",
                          headers=admin_headers).json()["documents"]
        if not docs:
            pytest.skip("No pending docs")
        doc_id = docs[0]["id"]
        res = client.put(f"/api/admin/documents/{doc_id}/review",
                         json={"status": "approved"}, headers=admin_headers)
        assert res.status_code == 200
        assert res.json()["status"] == "approved"

    def test_review_reject_document_with_note(self, client, admin_headers, user_headers):
        client.post(
            "/api/documents/upload",
            data={"doc_type": "govt_id", "event_slug": "go_kart"},
            files={"file": make_pdf("govt_fresh.pdf")},
            headers=user_headers,
        )
        docs = client.get("/api/admin/documents?status=pending",
                          headers=admin_headers).json()["documents"]
        if not docs:
            pytest.skip("No pending docs")
        doc_id = docs[0]["id"]
        res = client.put(f"/api/admin/documents/{doc_id}/review",
                         json={"status": "rejected", "reviewer_note": "Image is blurry"},
                         headers=admin_headers)
        assert res.status_code == 200
        assert res.json()["status"] == "rejected"

    def test_review_reupload_requested(self, client, admin_headers, user_headers):
        client.post(
            "/api/documents/upload",
            data={"doc_type": "driving_license", "event_slug": "go_kart"},
            files={"file": make_pdf("dl_fresh.pdf")},
            headers=user_headers,
        )
        docs = client.get("/api/admin/documents?status=pending",
                          headers=admin_headers).json()["documents"]
        if not docs:
            pytest.skip("No pending docs")
        doc_id = docs[0]["id"]
        res = client.put(f"/api/admin/documents/{doc_id}/review",
                         json={"status": "reupload_requested",
                               "reviewer_note": "Please upload clearer scan"},
                         headers=admin_headers)
        assert res.status_code == 200
        assert res.json()["status"] == "reupload_requested"

    def test_review_invalid_status(self, client, admin_headers):
        docs = client.get("/api/admin/documents", headers=admin_headers).json()["documents"]
        if not docs:
            pytest.skip("No docs")
        doc_id = docs[0]["id"]
        res = client.put(f"/api/admin/documents/{doc_id}/review",
                         json={"status": "dancing"}, headers=admin_headers)
        assert res.status_code == 400


# ─────────────────────────────────────────────────────────────────────────────
# PAYMENTS
# ─────────────────────────────────────────────────────────────────────────────
class TestAdminPayments:

    def test_list_payments_structure(self, client, admin_headers):
        res = client.get("/api/admin/payments", headers=admin_headers)
        assert res.status_code == 200
        data = res.json()
        assert "total" in data
        assert "payments" in data
        assert isinstance(data["payments"], list)

    def test_list_payments_filter_by_status(self, client, admin_headers):
        res = client.get("/api/admin/payments?status=paid", headers=admin_headers)
        for p in res.json()["payments"]:
            assert p["status"] == "paid"

    def test_payments_blocked_for_regular_user(self, client, user_headers):
        res = client.get("/api/admin/payments", headers=user_headers)
        assert res.status_code == 403

    def test_payment_create_order_fails_without_razorpay_keys(self, client, user_headers):
        # Razorpay keys are empty in test env → should return 503
        res = client.post("/api/payments/create-order?event_slug=go_kart", headers=user_headers)
        assert res.status_code == 503
        assert "not configured" in res.json()["detail"].lower()


# ─────────────────────────────────────────────────────────────────────────────
# NOTIFICATIONS
# ─────────────────────────────────────────────────────────────────────────────
class TestNotifications:

    def test_list_notifications_authenticated(self, client, user_headers):
        res = client.get("/api/notifications", headers=user_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_notifications_created_by_status_update(self, client, admin_headers, user_headers):
        # The admin status-update tests above should have created notifications
        notifs = client.get("/api/notifications", headers=user_headers).json()
        assert len(notifs) >= 1

    def test_notifications_have_expected_fields(self, client, user_headers):
        notifs = client.get("/api/notifications", headers=user_headers).json()
        if notifs:
            n = notifs[0]
            for f in ("id","title","message","notif_type","is_read","created_at"):
                assert f in n

    def test_unread_count_is_integer(self, client, user_headers):
        res = client.get("/api/notifications/unread-count", headers=user_headers)
        assert res.status_code == 200
        assert isinstance(res.json()["count"], int)

    def test_mark_all_read_sets_count_to_zero(self, client, user_headers):
        client.put("/api/notifications/read-all", headers=user_headers)
        res = client.get("/api/notifications/unread-count", headers=user_headers)
        assert res.json()["count"] == 0

    def test_mark_single_notification_read(self, client, admin_headers, user_headers):
        # Send a fresh message to generate a new notification
        teams = client.get("/api/admin/teams", headers=admin_headers).json()["teams"]
        if not teams:
            pytest.skip("No teams")
        client.post(f"/api/admin/teams/{teams[0]['id']}/message",
                    json={"subject": "Ping", "message": "Final check"},
                    headers=admin_headers)

        notifs = client.get("/api/notifications", headers=user_headers).json()
        unread = [n for n in notifs if not n["is_read"]]
        if not unread:
            pytest.skip("No unread notifications")
        notif_id = unread[0]["id"]

        res = client.put(f"/api/notifications/{notif_id}/read", headers=user_headers)
        assert res.status_code == 200
        assert res.json()["ok"] is True

    def test_notifications_unauthenticated(self, client):
        assert client.get("/api/notifications").status_code in (401, 403)
        assert client.get("/api/notifications/unread-count").status_code in (401, 403)
        assert client.put("/api/notifications/read-all").status_code in (401, 403)
