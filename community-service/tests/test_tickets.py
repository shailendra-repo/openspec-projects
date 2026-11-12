import io

from app import db
from app.models import AuditEvent, Category, Comment, Ticket
from tests.conftest import login


def test_resident_can_create_ticket_with_unique_number(client, app_instance, resident_user, category):
    login(client, resident_user["email"], resident_user["password"])
    resp = client.post("/tickets/new", data={
        "title": "Leaky tap", "description": "Kitchen tap leaking", "category_id": str(category["id"]), "priority": "high"
    }, follow_redirects=True)
    assert resp.status_code == 200
    assert b"created" in resp.data.lower()
    with app_instance.app_context():
        t = Ticket.query.filter_by(title="Leaky tap").first()
        assert t is not None and t.ticket_number.startswith("CS-")
        assert t.priority == "high" and t.category_id == category["id"]
        assert AuditEvent.query.filter_by(action="ticket.created", ticket_id=t.id).count() == 1


def test_ticket_numbers_unique(app_instance, resident_user):
    with app_instance.app_context():
        from app.services import generate_ticket_number
        n1 = generate_ticket_number()
        t = Ticket(ticket_number=n1, resident_id=resident_user["id"], title="A", description="B", status="open")
        db.session.add(t); db.session.commit()
        n2 = generate_ticket_number()
        assert n1 != n2


def test_board_manages_categories(client, app_instance, board_user):
    login(client, board_user["email"], board_user["password"])
    resp = client.post("/categories", data={"action": "create", "name": "Electrical"}, follow_redirects=True)
    assert b"Electrical" in resp.data
    with app_instance.app_context():
        cat = Category.query.filter_by(name="Electrical").first()
        assert cat and cat.is_active
        resp2 = client.post("/categories", data={"action": "toggle", "category_id": str(cat.id)}, follow_redirects=True)
        assert resp2.status_code == 200
        db.session.refresh(cat)
        assert cat.is_active is False
        assert AuditEvent.query.filter_by(action="category.created", entity_id=str(cat.id)).count() == 1
        assert AuditEvent.query.filter_by(action="category.toggled", entity_id=str(cat.id)).count() == 1


def test_resident_sees_only_own_tickets(client, app_instance, resident_user, other_resident):
    with app_instance.app_context():
        t1 = Ticket(ticket_number="CS-1", resident_id=resident_user["id"], title="Mine", description="d", status="open")
        t2 = Ticket(ticket_number="CS-2", resident_id=other_resident["id"], title="Other", description="d", status="open")
        db.session.add_all([t1, t2]); db.session.commit()
        t2id = t2.id
    login(client, resident_user["email"], resident_user["password"])
    resp = client.get("/dashboard")
    assert b"Mine" in resp.data and b"Other" not in resp.data
    resp = client.get(f"/tickets/{t2id}")
    assert resp.status_code == 404


def test_board_sees_all_tickets(client, app_instance, board_user, resident_user):
    with app_instance.app_context():
        t1 = Ticket(ticket_number="CS-A", resident_id=resident_user["id"], title="MineR", description="d", status="open")
        db.session.add(t1); db.session.commit()
    login(client, board_user["email"], board_user["password"])
    resp = client.get("/dashboard")
    assert b"MineR" in resp.data


def test_comments_and_threaded_reply(client, app_instance, board_user, resident_user):
    with app_instance.app_context():
        t = Ticket(ticket_number="CS-C1", resident_id=resident_user["id"], title="T", description="d", status="open")
        db.session.add(t); db.session.commit()
        tid = t.id
    login(client, board_user["email"], board_user["password"])
    client.post(f"/tickets/{tid}/comment", data={"body": "Board says hi"}, follow_redirects=True)
    with app_instance.app_context():
        c = Comment.query.filter_by(ticket_id=tid).first()
        assert c and c.body == "Board says hi"
        cid = c.id
    login(client, resident_user["email"], resident_user["password"])
    resp = client.post(f"/tickets/{tid}/comment", data={"body": "Resident reply", "parent_comment_id": str(cid)}, follow_redirects=True)
    assert resp.status_code == 200
    with app_instance.app_context():
        r = Comment.query.filter_by(parent_comment_id=cid).first()
        assert r and r.body == "Resident reply"
        assert AuditEvent.query.filter_by(action="comment.added", ticket_id=tid).count() == 2


def test_resident_cannot_comment_on_others_ticket(client, app_instance, resident_user, other_resident):
    with app_instance.app_context():
        t = Ticket(ticket_number="CS-CX", resident_id=other_resident["id"], title="T", description="d", status="open")
        db.session.add(t); db.session.commit()
        tid = t.id
    login(client, resident_user["email"], resident_user["password"])
    resp = client.post(f"/tickets/{tid}/comment", data={"body": "hack"})
    assert resp.status_code == 403
