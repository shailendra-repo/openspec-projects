from app import db
from app.models import User
from tests.conftest import login


def test_login_page_loads(client):
    resp = client.get("/login")
    assert resp.status_code == 200
    assert b"Login" in resp.data


def test_successful_resident_login(client, app_instance, resident_user):
    with app_instance.app_context():
        email = "resident@example.com"
    resp = login(client, email, "password123")
    assert resp.status_code == 200
    assert b"Dashboard" in resp.data
    assert b"resident" in resp.data


def test_successful_board_login(client, app_instance, board_user):
    resp = login(client, "board@example.com", "password123")
    assert resp.status_code == 200
    assert b"Manage Users" in resp.data


def test_invalid_credentials_no_session(client, resident_user):
    resp = client.post("/login", data={"email": "resident@example.com", "password": "wrong"}, follow_redirects=True)
    assert b"Invalid credentials" in resp.data
    # accessing protected page should redirect to login
    dash = client.get("/dashboard", follow_redirects=False)
    assert dash.status_code in (302, 401)


def test_logout(client, resident_user):
    login(client, "resident@example.com", "password123")
    resp = client.get("/logout", follow_redirects=True)
    assert b"Login" in resp.data
    dash = client.get("/dashboard", follow_redirects=False)
    assert dash.status_code in (302, 401)


def test_bootstrap_cli_creates_first_board(app_instance, runner):
    result = runner.invoke(args=["bootstrap-board", "--name", "Admin", "--email", "admin@example.com", "--password", "secret123"])
    assert result.exit_code == 0
    assert "Created board member" in result.output
    with app_instance.app_context():
        u = User.query.filter_by(email="admin@example.com").first()
        assert u is not None and u.role == "board" and u.is_active


def test_bootstrap_fails_when_board_exists(app_instance, runner, board_user):
    result = runner.invoke(args=["bootstrap-board", "--name", "Admin2", "--email", "admin2@example.com", "--password", "secret123"])
    assert result.exit_code != 0
    assert "already exists" in result.output
