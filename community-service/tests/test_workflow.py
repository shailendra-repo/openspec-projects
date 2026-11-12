from app import db
from app.models import AuditEvent, NotificationOutbox, Ticket
from tests.conftest import login


def setup_ticket(app_instance, resident_user, status="open"):
    with app_instance.app_context():
        t = Ticket(ticket_number="CS-WF-1", resident_id=resident_user["id"], title="WF", description="d", status=status)
        db.session.add(t); db.session.commit()
        return t.id


def test_workflow_propose_ack_close_and_notifications(client, app_instance, board_user, resident_user):
    tid = setup_ticket(app_instance, resident_user, "open")
    # propose
    login(client, board_user["email"], board_user["password"])
    resp = client.post(f"/tickets/{tid}/propose", follow_redirects=True)
    assert b"Resolution proposed" in resp.data
    with app_instance.app_context():
        t = db.session.get(Ticket, tid)
        assert t.status == "board_proposed"
        assert AuditEvent.query.filter_by(action="ticket.resolution_proposed", ticket_id=tid).count() == 1
        assert NotificationOutbox.query.filter_by(event_type="resolution.proposed").count() >= 1
    # close should fail before ack
    resp = client.post(f"/tickets/{tid}/close", follow_redirects=True)
    assert b"acknowledgement" in resp.data.lower() or b"required" in resp.data.lower() or b"Resident acknowledgement required" in resp.data
    with app_instance.app_context():
        assert db.session.get(Ticket, tid).status == "board_proposed"
    # resident ack
    login(client, resident_user["email"], resident_user["password"])
    resp = client.post(f"/tickets/{tid}/acknowledge", follow_redirects=True)
    assert b"acknowledged" in resp.data.lower()
    with app_instance.app_context():
        t = db.session.get(Ticket, tid)
        assert t.status == "resident_ack"
        assert AuditEvent.query.filter_by(action="ticket.resident_acknowledged", ticket_id=tid).count() == 1
    # close success
    login(client, board_user["email"], board_user["password"])
    resp = client.post(f"/tickets/{tid}/close", follow_redirects=True)
    assert b"Ticket closed" in resp.data
    with app_instance.app_context():
        t = db.session.get(Ticket, tid)
        assert t.status == "closed" and t.closed_at is not None


def test_resident_cannot_close_and_nonowner_cannot_ack(client, app_instance, board_user, resident_user, other_resident):
    tid = setup_ticket(app_instance, resident_user, "board_proposed")
    login(client, resident_user["email"], resident_user["password"])
    resp = client.post(f"/tickets/{tid}/close", follow_redirects=False)
    assert resp.status_code == 403
    with app_instance.app_context():
        assert db.session.get(Ticket, tid).status == "board_proposed"
    login(client, other_resident["email"], other_resident["password"])
    resp = client.post(f"/tickets/{tid}/acknowledge", follow_redirects=True)
    assert b"Only the owning resident" in resp.data or resp.status_code in (403, 404)
    with app_instance.app_context():
        assert db.session.get(Ticket, tid).status == "board_proposed"


def test_reproposal_after_ack_requires_fresh_ack(client, app_instance, board_user, resident_user):
    tid = setup_ticket(app_instance, resident_user, "open")
    login(client, board_user["email"], board_user["password"])
    client.post(f"/tickets/{tid}/propose", follow_redirects=True)
    login(client, resident_user["email"], resident_user["password"])
    client.post(f"/tickets/{tid}/acknowledge", follow_redirects=True)
    with app_instance.app_context():
        assert db.session.get(Ticket, tid).status == "resident_ack"
    login(client, board_user["email"], board_user["password"])
    client.post(f"/tickets/{tid}/propose", follow_redirects=True)
    with app_instance.app_context():
        assert db.session.get(Ticket, tid).status == "board_proposed"
        assert db.session.get(Ticket, tid).resident_ack_at is None
    # cannot close now
    resp = client.post(f"/tickets/{tid}/close", follow_redirects=True)
    assert b"acknowledgement" in resp.data.lower() or b"required" in resp.data.lower() or b"Resident acknowledgement required" in resp.data
    with app_instance.app_context():
        assert db.session.get(Ticket, tid).status == "board_proposed"
