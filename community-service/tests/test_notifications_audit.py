import io

from app import db
from app.models import Attachment, AuditEvent, NotificationOutbox, Ticket
from app.services import process_outbox, send_notification_email
from tests.conftest import login


def test_attachment_upload_and_authorized_download(client, app_instance, resident_user, board_user, other_resident):
    login(client, resident_user["email"], resident_user["password"])
    data = {
        "title": "Attach", "description": "desc", "category_id": "", "priority": "low",
        "attachments": (io.BytesIO(b"hello image"), "photo.txt")
    }
    resp = client.post("/tickets/new", data=data, content_type="multipart/form-data", follow_redirects=True)
    assert resp.status_code == 200
    with app_instance.app_context():
        t = Ticket.query.filter_by(title="Attach").first()
        assert t is not None
        att = Attachment.query.filter_by(ticket_id=t.id).first()
        assert att is not None and att.original_name == "photo.txt"
        att_id = att.id
        tid = t.id
    # owner can download
    resp = client.get(f"/attachments/{att_id}")
    assert resp.status_code == 200
    # board can download
    login(client, board_user["email"], board_user["password"])
    resp = client.get(f"/attachments/{att_id}")
    assert resp.status_code == 200
    # other resident cannot
    login(client, other_resident["email"], other_resident["password"])
    resp = client.get(f"/attachments/{att_id}")
    assert resp.status_code == 403
    # audit exists
    with app_instance.app_context():
        assert AuditEvent.query.filter_by(action="attachment.added", ticket_id=tid).count() >= 1


def test_audit_timeline_access_control(client, app_instance, resident_user, other_resident):
    with app_instance.app_context():
        t = Ticket(ticket_number="CS-AUD", resident_id=resident_user["id"], title="T", description="d", status="open")
        db.session.add(t); db.session.flush()
        db.session.add(AuditEvent(ticket_id=t.id, actor_id=resident_user["id"], action="ticket.created", entity_type="ticket", entity_id=str(t.id), details="x"))
        db.session.commit()
        tid = t.id
    login(client, resident_user["email"], resident_user["password"])
    resp = client.get(f"/tickets/{tid}/audit")
    assert resp.status_code == 200 and b"ticket.created" in resp.data
    login(client, other_resident["email"], other_resident["password"])
    resp = client.get(f"/tickets/{tid}/audit")
    assert resp.status_code == 404


def test_notification_outbox_and_unconfigured_smtp_nonblocking(app_instance, resident_user):
    with app_instance.app_context():
        n = NotificationOutbox(user_id=resident_user["id"], recipient_email=resident_user["email"], event_type="test", subject="s", body="b", status="pending")
        db.session.add(n); db.session.commit()
        ok = send_notification_email(n)
        assert ok is False
        assert n.status == "failed"
        assert n.attempts == 1
        assert n.last_error
        n2 = NotificationOutbox(user_id=resident_user["id"], recipient_email=resident_user["email"], event_type="test2", subject="s", body="b", status="pending")
        db.session.add(n2); db.session.commit()
        res = process_outbox(limit=10)
        assert res["failed"] >= 1
