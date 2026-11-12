from app import db
from app.models import AuditEvent, User
from tests.conftest import login


def test_board_can_create_resident(client, app_instance, board_user):
    login(client, "board@example.com", "password123")
    resp = client.post("/users/create", data={
        "name": "Res A", "email": "resa@example.com", "role": "resident", "password": "pass1234", "is_active": "on"
    }, follow_redirects=True)
    assert resp.status_code == 200
    with app_instance.app_context():
        u = User.query.filter_by(email="resa@example.com").first()
        assert u is not None and u.role == "resident"
        assert AuditEvent.query.filter_by(action="user.created", entity_type="user", entity_id=str(u.id)).count() == 1


def test_board_can_create_board_member(client, app_instance, board_user):
    login(client, "board@example.com", "password123")
    resp = client.post("/users/create", data={
        "name": "Board B", "email": "boardb@example.com", "role": "board", "password": "pass1234", "is_active": "on"
    }, follow_redirects=True)
    assert resp.status_code == 200
    with app_instance.app_context():
        assert User.query.filter_by(email="boardb@example.com", role="board").first() is not None


def test_resident_cannot_access_user_management(client, resident_user):
    login(client, "resident@example.com", "password123")
    resp = client.get("/users")
    assert resp.status_code == 403
    resp = client.post("/users/create", data={"name": "X", "email": "x@example.com", "role": "resident", "password": "p"}, follow_redirects=False)
    assert resp.status_code == 403
