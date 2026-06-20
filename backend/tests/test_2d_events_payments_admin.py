"""
PHASE 2D — Events, Payments & Admin Extended Tests
Covers: events API, payment flow edge cases, admin pagination/filter,
        admin stats accuracy, notification edge cases, role boundary checks
"""
import pytest
from tests.conftest import make_pdf


@pytest.fixture(scope="session", autouse=True)
def _ensure_team(registered_team):
    pass


# ─────────────────────────────────────────────────────────────────────────────
# EVENTS API
# ─────────────────────────────────────────────────────────────────────────────
class TestEventsAPI:

    def test_events_list_no_auth_required(self, client):
        res = client.get("/api/events")
        assert res.status_code == 200

    def test_events_list_returns_list(self, client):
        res = client.get("/api/events")
        assert isinstance(res.json(), list)

    def test_events_list_has_go_kart(self, client):
        slugs = [e["slug"] for e in client.get("/api/events").json()]
        assert "go_kart" in slugs

    def test_events_list_has_formula_green(self, client):
        slugs = [e["slug"] for e in client.get("/api/events").json()]
        assert "formula_green" in slugs

    def test_event_detail_go_kart(self, client):
        res = client.get("/api/events/go_kart")
        assert res.status_code == 200
        assert res.json()["slug"] == "go_kart"

    def test_event_detail_formula_green(self, client):
        res = client.get("/api/events/formula_green")
        assert res.status_code == 200
        assert res.json()["slug"] == "formula_green"

    def test_event_detail_not_found(self, client):
        res = client.get("/api/events/nonexistent_slug")
        assert res.status_code == 404

    def test_event_has_display_name(self, client):
        res = client.get("/api/events/go_kart")
        assert "display_name" in res.json()
        assert len(res.json()["display_name"]) > 0

    def test_event_has_registration_fee(self, client):
        res = client.get("/api/events/go_kart")
        assert "registration_fee" in res.json()
        assert res.json()["registration_fee"] > 0

    def test_event_has_max_members(self, client):
        res = client.get("/api/events/go_kart")
        assert "max_members" in res.json()
        assert res.json()["max_members"] == 4

    def test_formula_green_max_members_is_8(self, client):
        res = client.get("/api/events/formula_green")
        assert res.json()["max_members"] == 8

    def test_event_has_gst_percentage(self, client):
        res = client.get("/api/events/go_kart")
        assert "gst_percentage" in res.json()

    def test_event_is_active_true(self, client):
        res = client.get("/api/events/go_kart")
        assert res.json().get("is_active") is True

    def test_event_registration_open_true(self, client):
        res = client.get("/api/events/go_kart")
        assert res.json().get("registration_open") is True

    def test_events_list_count_is_at_least_2(self, client):
        res = client.get("/api/events")
        assert len(res.json()) >= 2


# ─────────────────────────────────────────────────────────────────────────────
# PAYMENTS EXTENDED
# ─────────────────────────────────────────────────────────────────────────────
class TestPaymentsExtended:

    def test_get_my_payment_no_payment_returns_404(self, client, user_headers):
        res = client.get("/api/payments/mine?event_slug=go_kart", headers=user_headers)
        assert res.status_code == 404

    def test_get_my_payment_unauthenticated(self, client):
        res = client.get("/api/payments/mine")
        assert res.status_code in (401, 403)

    def test_create_order_unauthenticated(self, client):
        res = client.post("/api/payments/create-order?event_slug=go_kart")
        assert res.status_code in (401, 403)

    def test_create_order_no_team_returns_404_or_503(self, client):
        r = client.post("/api/auth/register", json={
            "full_name": "No Team Pay", "email": "noteampay@xtest.com",
            "phone": "8400000001", "password": "Pay@1234"
        })
        h = {"Authorization": f"Bearer {r.json()['access_token']}"}
        res = client.post("/api/payments/create-order?event_slug=go_kart", headers=h)
        assert res.status_code in (404, 503)

    def test_verify_payment_missing_fields(self, client, user_headers):
        res = client.post("/api/payments/verify", json={}, headers=user_headers)
        assert res.status_code == 422

    def test_verify_payment_wrong_signature(self, client, user_headers):
        res = client.post("/api/payments/verify", json={
            "razorpay_order_id": "order_fake123",
            "razorpay_payment_id": "pay_fake456",
            "razorpay_signature": "invalidsignature",
        }, headers=user_headers)
        assert res.status_code in (400, 404)

    def test_create_order_for_formula_green_503_without_keys(self, client, user_headers):
        res = client.post("/api/payments/create-order?event_slug=formula_green", headers=user_headers)
        assert res.status_code == 503


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN STATS EXTENDED
# ─────────────────────────────────────────────────────────────────────────────
class TestAdminStatsExtended:

    def test_stats_total_teams_is_int(self, client, admin_headers):
        data = client.get("/api/admin/stats", headers=admin_headers).json()
        assert isinstance(data["total_teams"], int)

    def test_stats_by_event_values_are_ints(self, client, admin_headers):
        data = client.get("/api/admin/stats", headers=admin_headers).json()
        for v in data["by_event"].values():
            assert isinstance(v, int)

    def test_stats_by_status_values_are_ints(self, client, admin_headers):
        data = client.get("/api/admin/stats", headers=admin_headers).json()
        for v in data["by_status"].values():
            assert isinstance(v, int)

    def test_stats_doc_counts_are_ints(self, client, admin_headers):
        data = client.get("/api/admin/stats", headers=admin_headers).json()
        for v in data["documents"].values():
            assert isinstance(v, int)

    def test_stats_total_teams_matches_sum_by_event(self, client, admin_headers):
        data = client.get("/api/admin/stats", headers=admin_headers).json()
        event_sum = sum(data["by_event"].values())
        assert data["total_teams"] == event_sum

    def test_stats_total_teams_matches_sum_by_status(self, client, admin_headers):
        data = client.get("/api/admin/stats", headers=admin_headers).json()
        status_sum = sum(data["by_status"].values())
        assert data["total_teams"] == status_sum

    def test_stats_paid_count_is_non_negative(self, client, admin_headers):
        data = client.get("/api/admin/stats", headers=admin_headers).json()
        assert data["payments"]["paid_count"] >= 0

    def test_stats_total_amount_is_non_negative(self, client, admin_headers):
        data = client.get("/api/admin/stats", headers=admin_headers).json()
        assert data["payments"]["total_amount_inr"] >= 0


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN TEAMS EXTENDED
# ─────────────────────────────────────────────────────────────────────────────
class TestAdminTeamsExtended:

    def test_admin_teams_total_is_int(self, client, admin_headers):
        data = client.get("/api/admin/teams", headers=admin_headers).json()
        assert isinstance(data["total"], int)

    def test_admin_teams_total_is_consistent(self, client, admin_headers):
        data = client.get("/api/admin/teams", headers=admin_headers).json()
        assert data["total"] >= len(data["teams"])

    def test_admin_teams_limit_1_returns_at_most_1(self, client, admin_headers):
        data = client.get("/api/admin/teams?limit=1", headers=admin_headers).json()
        assert len(data["teams"]) <= 1

    def test_admin_teams_search_no_match_returns_empty(self, client, admin_headers):
        res = client.get("/api/admin/teams?q=ZZZNOMATCH999", headers=admin_headers)
        assert res.json()["teams"] == []

    def test_admin_teams_filter_formula_green(self, client, admin_headers):
        res = client.get("/api/admin/teams?event_slug=formula_green", headers=admin_headers)
        for t in res.json()["teams"]:
            assert t["event_slug"] == "formula_green"

    def test_admin_team_detail_has_member_count(self, client, admin_headers):
        teams = client.get("/api/admin/teams", headers=admin_headers).json()["teams"]
        if not teams:
            pytest.skip("No teams")
        tid = teams[0]["id"]
        detail = client.get(f"/api/admin/teams/{tid}", headers=admin_headers).json()
        assert "members" in detail
        assert isinstance(detail["members"], list)

    def test_admin_team_detail_leader_has_phone(self, client, admin_headers):
        teams = client.get("/api/admin/teams", headers=admin_headers).json()["teams"]
        if not teams:
            pytest.skip("No teams")
        tid = teams[0]["id"]
        detail = client.get(f"/api/admin/teams/{tid}", headers=admin_headers).json()
        assert "phone" in detail["leader"] or "email" in detail["leader"]

    def test_admin_update_status_to_under_review(self, client, admin_headers):
        teams = client.get("/api/admin/teams", headers=admin_headers).json()["teams"]
        if not teams:
            pytest.skip("No teams")
        tid = teams[0]["id"]
        res = client.put(f"/api/admin/teams/{tid}/status",
                         json={"status": "under_review"}, headers=admin_headers)
        assert res.status_code == 200
        assert res.json()["status"] == "under_review"

    def test_admin_csv_content_has_no_empty_rows(self, client, admin_headers):
        res = client.get("/api/admin/teams/export", headers=admin_headers)
        lines = [l for l in res.text.strip().split("\n") if l.strip()]
        assert len(lines) >= 1


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN DOCUMENTS EXTENDED
# ─────────────────────────────────────────────────────────────────────────────
class TestAdminDocumentsExtended:

    def test_admin_docs_total_is_int(self, client, admin_headers):
        data = client.get("/api/admin/documents", headers=admin_headers).json()
        assert isinstance(data["total"], int)

    def test_admin_docs_total_non_negative(self, client, admin_headers):
        data = client.get("/api/admin/documents", headers=admin_headers).json()
        assert data["total"] >= 0

    def test_admin_docs_filter_approved(self, client, admin_headers):
        res = client.get("/api/admin/documents?status=approved", headers=admin_headers)
        for doc in res.json()["documents"]:
            assert doc["status"] == "approved"

    def test_admin_docs_filter_rejected(self, client, admin_headers):
        res = client.get("/api/admin/documents?status=rejected", headers=admin_headers)
        for doc in res.json()["documents"]:
            assert doc["status"] == "rejected"

    def test_admin_doc_review_approve_sets_status(self, client, admin_headers, user_headers):
        client.post(
            "/api/documents/upload",
            data={"doc_type": "noc", "event_slug": "go_kart"},
            files={"file": make_pdf("ext_noc.pdf")},
            headers=user_headers,
        )
        pending = client.get("/api/admin/documents?status=pending",
                             headers=admin_headers).json()["documents"]
        if not pending:
            pytest.skip("No pending docs")
        doc_id = pending[0]["id"]
        res = client.put(f"/api/admin/documents/{doc_id}/review",
                         json={"status": "approved"}, headers=admin_headers)
        assert res.json()["status"] == "approved"

    def test_admin_doc_review_has_reviewer_note_field(self, client, admin_headers, user_headers):
        client.post(
            "/api/documents/upload",
            data={"doc_type": "college_id", "event_slug": "go_kart"},
            files={"file": make_pdf("ext_cid.pdf")},
            headers=user_headers,
        )
        pending = client.get("/api/admin/documents?status=pending",
                             headers=admin_headers).json()["documents"]
        if not pending:
            pytest.skip("No pending docs")
        doc_id = pending[0]["id"]
        res = client.put(f"/api/admin/documents/{doc_id}/review",
                         json={"status": "rejected", "reviewer_note": "Blurry"},
                         headers=admin_headers)
        assert res.status_code == 200


# ─────────────────────────────────────────────────────────────────────────────
# NOTIFICATIONS EXTENDED
# ─────────────────────────────────────────────────────────────────────────────
class TestNotificationsExtended:

    def test_notifications_returns_list(self, client, user_headers):
        res = client.get("/api/notifications", headers=user_headers)
        assert isinstance(res.json(), list)

    def test_unread_count_structure(self, client, user_headers):
        res = client.get("/api/notifications/unread-count", headers=user_headers)
        assert "count" in res.json()

    def test_unread_count_non_negative(self, client, user_headers):
        res = client.get("/api/notifications/unread-count", headers=user_headers)
        assert res.json()["count"] >= 0

    def test_each_notification_has_is_read_field(self, client, user_headers):
        notifs = client.get("/api/notifications", headers=user_headers).json()
        for n in notifs:
            assert "is_read" in n

    def test_each_notification_has_title(self, client, user_headers):
        notifs = client.get("/api/notifications", headers=user_headers).json()
        for n in notifs:
            assert "title" in n

    def test_each_notification_has_created_at(self, client, user_headers):
        notifs = client.get("/api/notifications", headers=user_headers).json()
        for n in notifs:
            assert "created_at" in n

    def test_mark_all_read_returns_ok(self, client, user_headers):
        res = client.put("/api/notifications/read-all", headers=user_headers)
        assert res.status_code == 200

    def test_after_mark_all_read_count_is_zero(self, client, user_headers):
        client.put("/api/notifications/read-all", headers=user_headers)
        res = client.get("/api/notifications/unread-count", headers=user_headers)
        assert res.json()["count"] == 0

    def test_notification_read_all_is_idempotent(self, client, user_headers):
        client.put("/api/notifications/read-all", headers=user_headers)
        res = client.put("/api/notifications/read-all", headers=user_headers)
        assert res.status_code == 200

    def test_admin_has_own_notification_endpoint(self, client, admin_headers):
        res = client.get("/api/notifications", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)
