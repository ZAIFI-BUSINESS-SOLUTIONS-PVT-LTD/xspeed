"""
PHASE 2B — Extended Team Tests
Covers: field validation, registration ID format, multi-event, pagination,
        search/filter edge cases, member validation, update edge cases
"""


def _reg_user(client, email, phone, pw="Team@1234"):
    r = client.post("/api/auth/register", json={
        "full_name": "T User", "email": email, "phone": phone, "password": pw
    })
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _make_team(client, headers, name, slug, members=None, **kwargs):
    payload = {
        "team_name": name, "event_slug": slug,
        "institution": "Test Univ", "city": "Chennai", "state": "Tamil Nadu",
        "members": members or [{"name": "Driver", "email": "d@xtest.com"}],
        **kwargs,
    }
    return client.post("/api/teams", json=payload, headers=headers)


# ─────────────────────────────────────────────────────────────────────────────
# CREATE — FIELD VALIDATION
# ─────────────────────────────────────────────────────────────────────────────
class TestCreateTeamValidation:

    def test_missing_team_name(self, client, user_headers):
        res = client.post("/api/teams", json={
            "event_slug": "go_kart", "institution": "X", "city": "X", "state": "X",
            "members": [{"name": "A", "email": "a@xtest.com"}],
        }, headers=user_headers)
        assert res.status_code == 422

    def test_missing_event_slug(self, client, user_headers):
        res = client.post("/api/teams", json={
            "team_name": "No Slug", "institution": "X", "city": "X", "state": "X",
            "members": [{"name": "A", "email": "a@xtest.com"}],
        }, headers=user_headers)
        assert res.status_code == 422

    def test_missing_institution(self, client, user_headers):
        res = client.post("/api/teams", json={
            "team_name": "No Inst", "event_slug": "go_kart",
            "city": "X", "state": "X",
            "members": [{"name": "A", "email": "a@xtest.com"}],
        }, headers=user_headers)
        assert res.status_code in (400, 422)

    def test_team_name_stored_correctly(self, client):
        h = _reg_user(client, "namechk@xtest.com", "8200000001")
        res = _make_team(client, h, "Stored Name Check", "go_kart")
        assert res.status_code == 200
        assert res.json()["team_name"] == "Stored Name Check"

    def test_member_missing_name(self, client):
        h = _reg_user(client, "membname@xtest.com", "8200000002")
        res = client.post("/api/teams", json={
            "team_name": "No Member Name",
            "event_slug": "go_kart",
            "institution": "X", "city": "X", "state": "X",
            "members": [{"email": "x@xtest.com"}],
        }, headers=h)
        assert res.status_code in (400, 422)

    def test_max_members_exactly_4_accepted(self, client):
        h = _reg_user(client, "max4@xtest.com", "8200000003")
        res = _make_team(client, h, "Exact Four", "go_kart", members=[
            {"name": f"M{i}", "email": f"m4_{i}@xtest.com"} for i in range(4)
        ])
        assert res.status_code == 200
        assert len(res.json()["members"]) == 4

    def test_exactly_1_member_accepted(self, client):
        h = _reg_user(client, "one@xtest.com", "8200000004")
        res = _make_team(client, h, "Solo Team", "go_kart", members=[
            {"name": "Solo", "email": "solo@xtest.com"}
        ])
        assert res.status_code == 200

    def test_formula_green_allows_up_to_8_members(self, client):
        h = _reg_user(client, "fg8@xtest.com", "8200000005")
        res = _make_team(client, h, "Green Eight", "formula_green", members=[
            {"name": f"G{i}", "email": f"fg8_{i}@xtest.com"} for i in range(8)
        ])
        assert res.status_code == 200
        assert len(res.json()["members"]) == 8

    def test_formula_green_rejects_9_members(self, client):
        h = _reg_user(client, "fg9@xtest.com", "8200000006")
        res = _make_team(client, h, "Green Nine", "formula_green", members=[
            {"name": f"N{i}", "email": f"fg9_{i}@xtest.com"} for i in range(9)
        ])
        assert res.status_code == 400


# ─────────────────────────────────────────────────────────────────────────────
# REGISTRATION ID FORMAT
# ─────────────────────────────────────────────────────────────────────────────
class TestRegistrationIDFormat:

    def test_go_kart_prefix_is_XSP_GK(self, client):
        h = _reg_user(client, "rid1@xtest.com", "8200000010")
        res = _make_team(client, h, "RID GK", "go_kart")
        assert res.json()["registration_id"].startswith("XSP-GK-")

    def test_formula_green_prefix_is_XSP_FG(self, client):
        h = _reg_user(client, "rid2@xtest.com", "8200000011")
        res = _make_team(client, h, "RID FG", "formula_green")
        assert res.json()["registration_id"].startswith("XSP-FG-")

    def test_registration_id_has_4_parts(self, client):
        h = _reg_user(client, "rid3@xtest.com", "8200000012")
        res = _make_team(client, h, "RID Parts", "go_kart")
        parts = res.json()["registration_id"].split("-")
        assert len(parts) == 4

    def test_two_teams_different_registration_ids(self, client):
        h1 = _reg_user(client, "rid4a@xtest.com", "8200000013")
        h2 = _reg_user(client, "rid4b@xtest.com", "8200000014")
        r1 = _make_team(client, h1, "Unique A", "go_kart")
        r2 = _make_team(client, h2, "Unique B", "go_kart")
        assert r1.json()["registration_id"] != r2.json()["registration_id"]

    def test_registration_id_returned_in_create_response(self, client):
        h = _reg_user(client, "rid5@xtest.com", "8200000015")
        res = _make_team(client, h, "RID Create", "go_kart")
        assert "registration_id" in res.json()


# ─────────────────────────────────────────────────────────────────────────────
# GET /MINE EDGE CASES
# ─────────────────────────────────────────────────────────────────────────────
class TestGetMyTeamExtended:

    def test_get_mine_returns_event_slug(self, client, user_headers):
        res = client.get("/api/teams/mine?event_slug=go_kart", headers=user_headers)
        assert res.json()["event_slug"] == "go_kart"

    def test_get_mine_returns_status(self, client, user_headers):
        res = client.get("/api/teams/mine?event_slug=go_kart", headers=user_headers)
        assert "status" in res.json()

    def test_get_mine_returns_members_list(self, client, user_headers):
        res = client.get("/api/teams/mine?event_slug=go_kart", headers=user_headers)
        assert isinstance(res.json()["members"], list)

    def test_get_mine_returns_institution(self, client, user_headers):
        res = client.get("/api/teams/mine?event_slug=go_kart", headers=user_headers)
        assert "institution" in res.json()

    def test_get_mine_different_event_slug_returns_different_team(self, client, user_headers):
        gk = client.get("/api/teams/mine?event_slug=go_kart", headers=user_headers)
        fg = client.get("/api/teams/mine?event_slug=formula_green", headers=user_headers)
        assert gk.status_code == 200
        assert fg.status_code == 200
        assert gk.json()["registration_id"] != fg.json()["registration_id"]


# ─────────────────────────────────────────────────────────────────────────────
# UPDATE EDGE CASES
# ─────────────────────────────────────────────────────────────────────────────
class TestUpdateTeamExtended:

    def test_update_institution(self, client, user_headers):
        res = client.put("/api/teams/mine?event_slug=go_kart", json={
            "institution": "IIT Bombay"
        }, headers=user_headers)
        assert res.status_code == 200
        assert res.json()["institution"] == "IIT Bombay"

    def test_update_empty_body_returns_unchanged(self, client, user_headers):
        before = client.get("/api/teams/mine?event_slug=go_kart", headers=user_headers).json()
        after_res = client.put("/api/teams/mine?event_slug=go_kart", json={}, headers=user_headers)
        assert after_res.status_code == 200
        assert after_res.json()["team_name"] == before["team_name"]

    def test_update_returns_registration_id_unchanged(self, client, user_headers):
        before = client.get("/api/teams/mine?event_slug=go_kart", headers=user_headers).json()
        client.put("/api/teams/mine?event_slug=go_kart", json={"team_name": "Reg ID Stable"},
                   headers=user_headers)
        after = client.get("/api/teams/mine?event_slug=go_kart", headers=user_headers).json()
        assert before["registration_id"] == after["registration_id"]

    def test_update_city(self, client, user_headers):
        res = client.put("/api/teams/mine?event_slug=go_kart", json={
            "city": "Bangalore"
        }, headers=user_headers)
        assert res.status_code == 200
        assert res.json()["city"] == "Bangalore"

    def test_update_nonexistent_event_returns_404(self, client, user_headers):
        res = client.put("/api/teams/mine?event_slug=nosuchevent", json={
            "team_name": "Ghost Update"
        }, headers=user_headers)
        assert res.status_code == 404


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC TEAMS EXTENDED
# ─────────────────────────────────────────────────────────────────────────────
class TestPublicTeamsExtended:

    def test_public_teams_with_event_slug_param_returns_200(self, client):
        res = client.get("/api/teams/public?event_slug=go_kart")
        assert res.status_code == 200

    def test_public_teams_all_have_event_slug_field(self, client):
        res = client.get("/api/teams/public")
        assert res.status_code == 200
        for t in res.json():
            assert "event_slug" in t

    def test_public_teams_includes_go_kart_entries(self, client):
        res = client.get("/api/teams/public")
        slugs = {t["event_slug"] for t in res.json()}
        assert "go_kart" in slugs

    def test_public_teams_includes_formula_green_entries(self, client):
        res = client.get("/api/teams/public")
        slugs = {t["event_slug"] for t in res.json()}
        assert "formula_green" in slugs

    def test_public_teams_returns_list_type(self, client):
        res = client.get("/api/teams/public")
        assert isinstance(res.json(), list)

    def test_public_teams_no_hashed_password_field(self, client):
        res = client.get("/api/teams/public")
        for team in res.json():
            assert "hashed_password" not in str(team)
