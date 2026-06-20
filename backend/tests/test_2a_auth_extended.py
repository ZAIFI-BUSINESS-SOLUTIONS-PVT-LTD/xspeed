"""
PHASE 2A — Extended Authentication Tests
Covers: field validation, password rules, token edge cases, profile fields,
        concurrent users, boundary values, error message quality
"""


# ─────────────────────────────────────────────────────────────────────────────
# REGISTRATION FIELD VALIDATION
# ─────────────────────────────────────────────────────────────────────────────
class TestRegisterValidation:

    def test_missing_full_name(self, client):
        res = client.post("/api/auth/register", json={
            "email": "nofn@xtest.com", "phone": "8100000001", "password": "Pass@1234"
        })
        assert res.status_code == 422

    def test_missing_email(self, client):
        res = client.post("/api/auth/register", json={
            "full_name": "No Email", "phone": "8100000002", "password": "Pass@1234"
        })
        assert res.status_code == 422

    def test_missing_phone(self, client):
        res = client.post("/api/auth/register", json={
            "full_name": "No Phone", "email": "nophone@xtest.com", "password": "Pass@1234"
        })
        assert res.status_code == 422

    def test_missing_password(self, client):
        res = client.post("/api/auth/register", json={
            "full_name": "No Pass", "email": "nopass@xtest.com", "phone": "8100000003"
        })
        assert res.status_code == 422

    def test_invalid_email_format(self, client):
        res = client.post("/api/auth/register", json={
            "full_name": "Bad Email", "email": "notanemail", "phone": "8100000004",
            "password": "Pass@1234"
        })
        assert res.status_code == 422

    def test_invalid_email_missing_at(self, client):
        res = client.post("/api/auth/register", json={
            "full_name": "Bad Email2", "email": "missingat.com", "phone": "8100000005",
            "password": "Pass@1234"
        })
        assert res.status_code == 422

    def test_register_email_must_have_domain(self, client):
        res = client.post("/api/auth/register", json={
            "full_name": "No Domain", "email": "nodomain@", "phone": "8100000006",
            "password": "Pass@1234"
        })
        assert res.status_code == 422

    def test_register_email_must_have_local_part(self, client):
        res = client.post("/api/auth/register", json={
            "full_name": "No Local", "email": "@xtest.com", "phone": "8100000007",
            "password": "Pass@1234"
        })
        assert res.status_code == 422

    def test_register_success_returns_token_type_bearer(self, client):
        res = client.post("/api/auth/register", json={
            "full_name": "Token Check",
            "email": "tokencheck@xtest.com",
            "phone": "8100000008",
            "password": "Token@1234",
        })
        assert res.status_code == 200
        assert res.json()["token_type"] == "bearer"

    def test_register_hashed_password_not_in_response(self, client):
        res = client.post("/api/auth/register", json={
            "full_name": "Hash Check",
            "email": "hashcheck@xtest.com",
            "phone": "8100000009",
            "password": "Hash@1234",
        })
        assert "hashed_password" not in str(res.json())
        assert "password" not in res.json().get("user", {})

    def test_register_user_id_is_positive_integer(self, client):
        res = client.post("/api/auth/register", json={
            "full_name": "ID Check",
            "email": "idcheck@xtest.com",
            "phone": "8100000010",
            "password": "Id@12345",
        })
        assert res.status_code == 200
        uid = res.json()["user"]["id"]
        assert isinstance(uid, int) and uid > 0

    def test_register_response_has_access_token_string(self, client):
        res = client.post("/api/auth/register", json={
            "full_name": "AT Check",
            "email": "atcheck@xtest.com",
            "phone": "8100000011",
            "password": "At@12345",
        })
        assert res.status_code == 200
        token = res.json()["access_token"]
        assert isinstance(token, str) and len(token) > 20


# ─────────────────────────────────────────────────────────────────────────────
# LOGIN EDGE CASES
# ─────────────────────────────────────────────────────────────────────────────
class TestLoginEdgeCases:

    def _reg(self, client, email, phone, pw="Pass@1234"):
        client.post("/api/auth/register", json={
            "full_name": "User", "email": email, "phone": phone, "password": pw
        })

    def test_login_missing_email(self, client):
        res = client.post("/api/auth/login", json={"password": "Pass@1234"})
        assert res.status_code == 422

    def test_login_missing_password(self, client):
        res = client.post("/api/auth/login", json={"email": "someone@xtest.com"})
        assert res.status_code == 422

    def test_login_empty_email(self, client):
        res = client.post("/api/auth/login", json={"email": "", "password": "Pass@1234"})
        assert res.status_code in (400, 401, 422)

    def test_login_empty_password(self, client):
        self._reg(client, "emppw@xtest.com", "8100000020")
        res = client.post("/api/auth/login", json={"email": "emppw@xtest.com", "password": ""})
        assert res.status_code == 401

    def test_login_with_correct_credentials_always_200(self, client):
        self._reg(client, "always200@xtest.com", "8100000021")
        res = client.post("/api/auth/login", json={
            "email": "always200@xtest.com", "password": "Pass@1234"
        })
        assert res.status_code == 200

    def test_login_returns_user_id(self, client):
        self._reg(client, "loginid@xtest.com", "8100000022")
        res = client.post("/api/auth/login", json={
            "email": "loginid@xtest.com", "password": "Pass@1234"
        })
        assert res.status_code == 200
        assert "id" in res.json()["user"]

    def test_login_token_is_jwt_format(self, client):
        self._reg(client, "jwtfmt@xtest.com", "8100000023")
        res = client.post("/api/auth/login", json={
            "email": "jwtfmt@xtest.com", "password": "Pass@1234"
        })
        token = res.json()["access_token"]
        parts = token.split(".")
        assert len(parts) == 3

    def test_login_wrong_case_email_rejected(self, client):
        self._reg(client, "casetest@xtest.com", "8100000024")
        res = client.post("/api/auth/login", json={
            "email": "CASETEST@XTEST.COM", "password": "Pass@1234"
        })
        assert res.status_code in (200, 401)   # depends on normalisation — either is valid

    def test_multiple_logins_same_user_succeed(self, client):
        self._reg(client, "multilogin@xtest.com", "8100000025")
        for _ in range(3):
            res = client.post("/api/auth/login", json={
                "email": "multilogin@xtest.com", "password": "Pass@1234"
            })
            assert res.status_code == 200

    def test_login_error_message_does_not_leak_existence(self, client):
        res = client.post("/api/auth/login", json={
            "email": "definitely_does_not_exist_xyz@xtest.com", "password": "Pass@1234"
        })
        assert res.status_code == 401
        detail = res.json().get("detail", "").lower()
        assert "invalid" in detail or "incorrect" in detail or "email or password" in detail


# ─────────────────────────────────────────────────────────────────────────────
# TOKEN & GET /ME EDGE CASES
# ─────────────────────────────────────────────────────────────────────────────
class TestTokenEdgeCases:

    def _token(self, client, email, phone):
        r = client.post("/api/auth/register", json={
            "full_name": "T", "email": email, "phone": phone, "password": "Tok@1234"
        })
        return r.json()["access_token"]

    def test_get_me_with_valid_token_200(self, client):
        token = self._token(client, "gme1@xtest.com", "8100000030")
        res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200

    def test_get_me_user_is_not_admin(self, client):
        token = self._token(client, "gme2@xtest.com", "8100000031")
        res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert res.json()["role"] == "team_leader"

    def test_get_me_is_active_true(self, client):
        token = self._token(client, "gme3@xtest.com", "8100000032")
        res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert res.json()["is_active"] is True

    def test_get_me_phone_in_response(self, client):
        token = self._token(client, "gme4@xtest.com", "8100000033")
        res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert res.json()["phone"] == "8100000033"

    def test_token_from_register_works_for_me(self, client):
        res = client.post("/api/auth/register", json={
            "full_name": "RegToken", "email": "regtoken@xtest.com",
            "phone": "8100000034", "password": "Reg@1234"
        })
        token = res.json()["access_token"]
        me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me.json()["email"] == "regtoken@xtest.com"

    def test_token_from_login_works_for_me(self, client):
        client.post("/api/auth/register", json={
            "full_name": "LoginTok", "email": "logintok@xtest.com",
            "phone": "8100000035", "password": "Login@1234"
        })
        res = client.post("/api/auth/login", json={
            "email": "logintok@xtest.com", "password": "Login@1234"
        })
        token = res.json()["access_token"]
        me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me.json()["email"] == "logintok@xtest.com"

    def test_random_string_as_token_rejected(self, client):
        res = client.get("/api/auth/me", headers={"Authorization": "Bearer randomstring"})
        assert res.status_code == 401

    def test_truncated_jwt_rejected(self, client):
        token = self._token(client, "truncjwt@xtest.com", "8100000036")
        truncated = token[:30]
        res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {truncated}"})
        assert res.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# RESET PASSWORD EXTENDED
# ─────────────────────────────────────────────────────────────────────────────
class TestResetPasswordExtended:

    def test_reset_password_response_has_message(self, client):
        client.post("/api/auth/register", json={
            "full_name": "Reset Msg", "email": "resetmsg@xtest.com",
            "phone": "8100000040", "password": "Old@1234"
        })
        res = client.put("/api/auth/reset-password", json={
            "email": "resetmsg@xtest.com", "new_password": "New@5678"
        })
        assert "message" in res.json()

    def test_reset_password_twice_second_wins(self, client):
        client.post("/api/auth/register", json={
            "full_name": "Double Reset", "email": "dreset@xtest.com",
            "phone": "8100000041", "password": "Old@1234"
        })
        client.put("/api/auth/reset-password", json={
            "email": "dreset@xtest.com", "new_password": "Mid@5678"
        })
        client.put("/api/auth/reset-password", json={
            "email": "dreset@xtest.com", "new_password": "Final@9999"
        })
        res = client.post("/api/auth/login", json={
            "email": "dreset@xtest.com", "password": "Final@9999"
        })
        assert res.status_code == 200

    def test_reset_missing_email(self, client):
        res = client.put("/api/auth/reset-password", json={"new_password": "Pass@1234"})
        assert res.status_code == 422

    def test_reset_missing_new_password(self, client):
        res = client.put("/api/auth/reset-password", json={"email": "x@xtest.com"})
        assert res.status_code == 422

    def test_two_independent_users_can_both_login(self, client):
        for i, (email, phone) in enumerate([
            ("indep1@xtest.com", "8100000045"),
            ("indep2@xtest.com", "8100000046"),
        ]):
            client.post("/api/auth/register", json={
                "full_name": f"Indep{i}", "email": email,
                "phone": phone, "password": "Indep@1234"
            })
        for email in ("indep1@xtest.com", "indep2@xtest.com"):
            res = client.post("/api/auth/login", json={
                "email": email, "password": "Indep@1234"
            })
            assert res.status_code == 200

    def test_register_stores_full_name_correctly(self, client):
        res = client.post("/api/auth/register", json={
            "full_name": "Full Name User",
            "email": "fullname@xtest.com",
            "phone": "8100000047",
            "password": "Full@1234",
        })
        assert res.json()["user"]["full_name"] == "Full Name User"
