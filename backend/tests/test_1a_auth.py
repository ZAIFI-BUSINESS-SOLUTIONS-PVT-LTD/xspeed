"""
PHASE 1A — Authentication Tests
Covers: register, login, GET /me, reset-password, token validation
"""


# ─────────────────────────────────────────────────────────────────────────────
# REGISTER
# ─────────────────────────────────────────────────────────────────────────────
class TestRegister:

    def test_register_success(self, client):
        res = client.post("/api/auth/register", json={
            "full_name": "Alice Racing",
            "email": "alice@xtest.com",
            "phone": "9111111111",
            "password": "Alice@1234",
        })
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "alice@xtest.com"
        assert data["user"]["role"] == "team_leader"
        assert "hashed_password" not in data["user"]

    def test_register_duplicate_email(self, client):
        client.post("/api/auth/register", json={
            "full_name": "Bob",
            "email": "bob.dup@xtest.com",
            "phone": "9222222222",
            "password": "Bob@1234",
        })
        res = client.post("/api/auth/register", json={
            "full_name": "Bob2",
            "email": "bob.dup@xtest.com",   # same email
            "phone": "9222222299",
            "password": "Bob@1234",
        })
        assert res.status_code == 400
        assert "Email already registered" in res.json()["detail"]

    def test_register_duplicate_phone(self, client):
        client.post("/api/auth/register", json={
            "full_name": "Carol",
            "email": "carol@xtest.com",
            "phone": "9333333333",
            "password": "Carol@1234",
        })
        res = client.post("/api/auth/register", json={
            "full_name": "Carol2",
            "email": "carol2@xtest.com",
            "phone": "9333333333",          # same phone
            "password": "Carol@1234",
        })
        assert res.status_code == 400
        assert "Phone number already registered" in res.json()["detail"]

    def test_register_returns_user_id(self, client):
        res = client.post("/api/auth/register", json={
            "full_name": "Dave",
            "email": "dave@xtest.com",
            "phone": "9444444444",
            "password": "Dave@1234",
        })
        assert res.status_code == 200
        assert "id" in res.json()["user"]
        assert isinstance(res.json()["user"]["id"], int)

    def test_register_role_is_team_leader(self, client):
        res = client.post("/api/auth/register", json={
            "full_name": "Eve",
            "email": "eve@xtest.com",
            "phone": "9555555555",
            "password": "Eve@1234",
        })
        assert res.json()["user"]["role"] == "team_leader"


# ─────────────────────────────────────────────────────────────────────────────
# LOGIN
# ─────────────────────────────────────────────────────────────────────────────
class TestLogin:

    def test_login_success(self, client):
        client.post("/api/auth/register", json={
            "full_name": "Frank",
            "email": "frank@xtest.com",
            "phone": "9666666666",
            "password": "Frank@1234",
        })
        res = client.post("/api/auth/login", json={
            "email": "frank@xtest.com",
            "password": "Frank@1234",
        })
        assert res.status_code == 200
        assert "access_token" in res.json()
        assert res.json()["token_type"] == "bearer"

    def test_login_wrong_password(self, client):
        client.post("/api/auth/register", json={
            "full_name": "Grace",
            "email": "grace@xtest.com",
            "phone": "9777777777",
            "password": "Grace@1234",
        })
        res = client.post("/api/auth/login", json={
            "email": "grace@xtest.com",
            "password": "WrongPassword",
        })
        assert res.status_code == 401
        assert "Invalid email or password" in res.json()["detail"]

    def test_login_nonexistent_email(self, client):
        res = client.post("/api/auth/login", json={
            "email": "ghost@xtest.com",
            "password": "Pass@1234",
        })
        assert res.status_code == 401

    def test_login_response_has_user_fields(self, client):
        client.post("/api/auth/register", json={
            "full_name": "Heidi",
            "email": "heidi@xtest.com",
            "phone": "9888888888",
            "password": "Heidi@1234",
        })
        res = client.post("/api/auth/login", json={
            "email": "heidi@xtest.com",
            "password": "Heidi@1234",
        })
        user = res.json()["user"]
        for field in ("id", "full_name", "email", "role"):
            assert field in user
        assert "hashed_password" not in user

    def test_login_case_sensitive_password(self, client):
        client.post("/api/auth/register", json={
            "full_name": "Ivan",
            "email": "ivan@xtest.com",
            "phone": "9900000011",
            "password": "Ivan@1234",
        })
        res = client.post("/api/auth/login", json={
            "email": "ivan@xtest.com",
            "password": "ivan@1234",        # lowercase i — wrong
        })
        assert res.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# GET /me
# ─────────────────────────────────────────────────────────────────────────────
class TestGetMe:

    def _register_and_token(self, client, email, phone):
        res = client.post("/api/auth/register", json={
            "full_name": "Test User",
            "email": email,
            "phone": phone,
            "password": "Test@1234",
        })
        return res.json()["access_token"]

    def test_get_me_authenticated(self, client):
        token = self._register_and_token(client, "me1@xtest.com", "9800000001")
        res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        assert res.json()["email"] == "me1@xtest.com"

    def test_get_me_returns_correct_schema(self, client):
        token = self._register_and_token(client, "me2@xtest.com", "9800000002")
        res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        data = res.json()
        for field in ("id", "full_name", "email", "phone", "role", "is_active"):
            assert field in data

    def test_get_me_no_token(self, client):
        res = client.get("/api/auth/me")
        assert res.status_code in (401, 403)   # FastAPI HTTPBearer returns 401 or 403

    def test_get_me_invalid_token(self, client):
        res = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.jwt.token"})
        assert res.status_code == 401

    def test_get_me_malformed_header(self, client):
        res = client.get("/api/auth/me", headers={"Authorization": "Token notbearer"})
        assert res.status_code in (401, 403)

    def test_get_me_empty_bearer(self, client):
        res = client.get("/api/auth/me", headers={"Authorization": "Bearer "})
        assert res.status_code in (401, 403)


# ─────────────────────────────────────────────────────────────────────────────
# RESET PASSWORD
# ─────────────────────────────────────────────────────────────────────────────
class TestResetPassword:

    def test_reset_password_success(self, client):
        client.post("/api/auth/register", json={
            "full_name": "Jake",
            "email": "jake@xtest.com",
            "phone": "9700000001",
            "password": "OldPass@1234",
        })
        res = client.put("/api/auth/reset-password", json={
            "email": "jake@xtest.com",
            "new_password": "NewPass@5678",
        })
        assert res.status_code == 200
        assert "Password updated" in res.json()["message"]

    def test_new_password_works_for_login(self, client):
        client.post("/api/auth/register", json={
            "full_name": "Kara",
            "email": "kara@xtest.com",
            "phone": "9700000002",
            "password": "OldPass@1234",
        })
        client.put("/api/auth/reset-password", json={
            "email": "kara@xtest.com",
            "new_password": "NewPass@5678",
        })
        login = client.post("/api/auth/login", json={
            "email": "kara@xtest.com",
            "password": "NewPass@5678",
        })
        assert login.status_code == 200

    def test_old_password_rejected_after_reset(self, client):
        client.post("/api/auth/register", json={
            "full_name": "Leo",
            "email": "leo@xtest.com",
            "phone": "9700000003",
            "password": "OldPass@1234",
        })
        client.put("/api/auth/reset-password", json={
            "email": "leo@xtest.com",
            "new_password": "NewPass@5678",
        })
        old_login = client.post("/api/auth/login", json={
            "email": "leo@xtest.com",
            "password": "OldPass@1234",
        })
        assert old_login.status_code == 401

    def test_reset_nonexistent_email(self, client):
        res = client.put("/api/auth/reset-password", json={
            "email": "nobody_at_all@xtest.com",
            "new_password": "Pass@1234",
        })
        assert res.status_code == 404
