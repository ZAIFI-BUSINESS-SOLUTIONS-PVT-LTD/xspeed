"""
PHASE 1B — Team Registration Tests
Covers: create team, get/mine, update, public list, event validation, edge cases
"""


# ─────────────────────────────────────────────────────────────────────────────
# CREATE TEAM
# ─────────────────────────────────────────────────────────────────────────────
class TestCreateTeam:

    def test_create_team_success(self, client, user_headers):
        res = client.post("/api/teams", json={
            "team_name": "Thunder Wheels",
            "event_slug": "go_kart",
            "institution": "VIT University",
            "city": "Vellore",
            "state": "Tamil Nadu",
            "members": [
                {"name": "Test Leader", "email": "leader@xspeedtest.com"},
            ],
        }, headers=user_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["team_name"] == "Thunder Wheels"
        assert data["event_slug"] == "go_kart"
        assert data["status"] == "submitted"
        assert data["registration_id"].startswith("XSP-GK-")
        assert len(data["members"]) == 1

    def test_create_team_registration_id_format(self, client, user_headers):
        # Get the team already created and check reg ID format
        res = client.get("/api/teams/mine?event_slug=go_kart", headers=user_headers)
        reg_id = res.json()["registration_id"]
        parts = reg_id.split("-")
        assert parts[0] == "XSP"
        assert parts[1] == "GK"
        assert len(parts[2]) == 4    # year
        assert len(parts[3]) == 6    # random hex

    def test_create_team_duplicate_same_event(self, client, user_headers):
        res = client.post("/api/teams", json={
            "team_name": "Thunder Wheels 2",
            "event_slug": "go_kart",
            "institution": "VIT",
            "city": "Vellore",
            "state": "Tamil Nadu",
            "members": [{"name": "Test Leader", "email": "leader@xspeedtest.com"}],
        }, headers=user_headers)
        assert res.status_code == 400
        assert "already registered" in res.json()["detail"].lower()

    def test_create_team_different_event_allowed(self, client, user_headers):
        res = client.post("/api/teams", json={
            "team_name": "Green Thunder",
            "event_slug": "formula_green",
            "institution": "VIT University",
            "city": "Vellore",
            "state": "Tamil Nadu",
            "members": [
                {"name": "Test Leader", "email": "leader@xspeedtest.com"},
                {"name": "Member Two", "email": "m2@xtest.com"},
            ],
        }, headers=user_headers)
        assert res.status_code == 200
        assert res.json()["event_slug"] == "formula_green"
        assert res.json()["registration_id"].startswith("XSP-FG-")

    def test_create_team_event_not_found(self, client, user_headers):
        res = client.post("/api/teams", json={
            "team_name": "Ghost Team",
            "event_slug": "nonexistent_slug",
            "institution": "MIT",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "members": [{"name": "Ghost", "email": "ghost@xtest.com"}],
        }, headers=user_headers)
        assert res.status_code == 404

    def test_create_team_too_many_members(self, client):
        reg = client.post("/api/auth/register", json={
            "full_name": "Max Member",
            "email": "maxmember@xtest.com",
            "phone": "9600000001",
            "password": "Max@1234",
        })
        h = {"Authorization": f"Bearer {reg.json()['access_token']}"}
        res = client.post("/api/teams", json={
            "team_name": "Big Team",
            "event_slug": "go_kart",     # max_members = 4
            "institution": "SRM",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "members": [
                {"name": f"Member {i}", "email": f"bm{i}@xtest.com"}
                for i in range(5)        # 5 > 4 limit
            ],
        }, headers=h)
        assert res.status_code == 400
        assert "Maximum" in res.json()["detail"]

    def test_create_team_zero_members_rejected(self, client):
        reg = client.post("/api/auth/register", json={
            "full_name": "Empty Leader",
            "email": "emptyleader@xtest.com",
            "phone": "9600000002",
            "password": "Empty@1234",
        })
        h = {"Authorization": f"Bearer {reg.json()['access_token']}"}
        res = client.post("/api/teams", json={
            "team_name": "Empty Crew",
            "event_slug": "go_kart",
            "institution": "SRM",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "members": [],
        }, headers=h)
        assert res.status_code == 400
        assert "At least 1" in res.json()["detail"]

    def test_create_team_unauthenticated(self, client):
        res = client.post("/api/teams", json={
            "team_name": "Unauth Team",
            "event_slug": "go_kart",
            "institution": "X",
            "city": "X",
            "state": "X",
            "members": [{"name": "X", "email": "x@x.com"}],
        })
        assert res.status_code in (401, 403)

    def test_create_team_stores_member_details(self, client):
        reg = client.post("/api/auth/register", json={
            "full_name": "Member Detail",
            "email": "mdetail@xtest.com",
            "phone": "9600000003",
            "password": "Detail@1234",
        })
        h = {"Authorization": f"Bearer {reg.json()['access_token']}"}
        res = client.post("/api/teams", json={
            "team_name": "Detail Team",
            "event_slug": "go_kart",
            "institution": "IIT Madras",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "members": [
                {
                    "name": "Primary Driver",
                    "email": "driver@xtest.com",
                    "phone": "9600000099",
                    "date_of_birth": "2000-05-15",
                }
            ],
        }, headers=h)
        assert res.status_code == 200
        member = res.json()["members"][0]
        assert member["name"] == "Primary Driver"
        assert member["phone"] == "9600000099"
        assert member["date_of_birth"] == "2000-05-15"


# ─────────────────────────────────────────────────────────────────────────────
# GET MY TEAM
# ─────────────────────────────────────────────────────────────────────────────
class TestGetMyTeam:

    def test_get_my_team_success(self, client, user_headers):
        res = client.get("/api/teams/mine?event_slug=go_kart", headers=user_headers)
        assert res.status_code == 200
        data = res.json()
        assert "registration_id" in data
        assert data["event_slug"] == "go_kart"

    def test_get_my_team_no_team(self, client):
        reg = client.post("/api/auth/register", json={
            "full_name": "No Team",
            "email": "noteam@xtest.com",
            "phone": "9600000010",
            "password": "Note@1234",
        })
        h = {"Authorization": f"Bearer {reg.json()['access_token']}"}
        res = client.get("/api/teams/mine", headers=h)
        assert res.status_code == 404

    def test_get_my_team_unauthenticated(self, client):
        res = client.get("/api/teams/mine")
        assert res.status_code in (401, 403)


# ─────────────────────────────────────────────────────────────────────────────
# UPDATE TEAM
# ─────────────────────────────────────────────────────────────────────────────
class TestUpdateTeam:

    def test_update_team_name(self, client, user_headers):
        res = client.put("/api/teams/mine?event_slug=go_kart", json={
            "team_name": "Thunder Wheels Pro",
        }, headers=user_headers)
        assert res.status_code == 200
        assert res.json()["team_name"] == "Thunder Wheels Pro"

    def test_update_team_city_state(self, client, user_headers):
        res = client.put("/api/teams/mine?event_slug=go_kart", json={
            "city": "Chennai",
            "state": "Tamil Nadu",
        }, headers=user_headers)
        assert res.status_code == 200
        assert res.json()["city"] == "Chennai"

    def test_update_team_members(self, client, user_headers):
        res = client.put("/api/teams/mine?event_slug=go_kart", json={
            "members": [
                {"name": "Test Leader",  "email": "leader@xspeedtest.com"},
                {"name": "Second Driver", "email": "driver2@xtest.com"},
            ],
        }, headers=user_headers)
        assert res.status_code == 200
        assert len(res.json()["members"]) == 2

    def test_update_too_many_members_rejected(self, client, user_headers):
        res = client.put("/api/teams/mine?event_slug=go_kart", json={
            "members": [
                {"name": f"M{i}", "email": f"um{i}@xtest.com"} for i in range(5)
            ],
        }, headers=user_headers)
        assert res.status_code == 400

    def test_partial_update_keeps_other_fields(self, client, user_headers):
        before = client.get("/api/teams/mine?event_slug=go_kart", headers=user_headers).json()
        client.put("/api/teams/mine?event_slug=go_kart", json={
            "team_name": "Partial Update Team",
        }, headers=user_headers)
        after = client.get("/api/teams/mine?event_slug=go_kart", headers=user_headers).json()
        assert after["institution"] == before["institution"]
        assert after["team_name"] == "Partial Update Team"


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC TEAMS
# ─────────────────────────────────────────────────────────────────────────────
class TestPublicTeams:

    def test_public_teams_no_auth_required(self, client):
        res = client.get("/api/teams/public")
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_public_teams_hides_personal_data(self, client):
        res = client.get("/api/teams/public")
        for team in res.json():
            assert "email" not in team
            assert "phone" not in team
            assert "hashed_password" not in team
            assert "leader_id" not in team

    def test_public_teams_shows_expected_fields(self, client):
        res = client.get("/api/teams/public")
        if res.json():
            team = res.json()[0]
            for field in ("team_name", "institution", "city", "event_slug", "status"):
                assert field in team

    def test_public_teams_contains_registered_team(self, client):
        res = client.get("/api/teams/public")
        names = [t["team_name"] for t in res.json()]
        assert any("Thunder" in n or "Partial" in n for n in names)
