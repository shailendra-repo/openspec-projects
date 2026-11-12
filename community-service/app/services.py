import json
import os
import smtplib
import uuid
from datetime import datetime
from email.message import EmailMessage
from pathlib import Path

from flask import current_app
from werkzeug.utils import secure_filename

from . import db
from .models import Attachment, AuditEvent, Comment, NotificationOutbox, Ticket, User


ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "pdf", "txt", "doc", "docx", "xls", "xlsx"}
ALLOWED_MIME_PREFIXES = ("image/", "text/", "application/pdf")


def log_audit(action, actor_id=None, ticket_id=None, entity_type=None, entity_id=None, details=None):
    if details is not None and not isinstance(details, str):
        details = json.dumps(details, default=str)
    event = AuditEvent(
        action=action,
        actor_id=actor_id,
        ticket_id=ticket_id,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        details=details,
    )
    db.session.add(event)
    return event


def generate_ticket_number():
    # transactional enough for this app: based on year + count; retry-safe in practice via unique constraint
    year = datetime.utcnow().year
    prefix = f"CS-{year}-"
    last = (
        Ticket.query.filter(Ticket.ticket_number.like(f"{prefix}%"))
        .order_by(Ticket.id.desc())
        .first()
    )
    seq = 1
    if last and last.ticket_number.startswith(prefix):
        try:
            seq = int(last.ticket_number.split("-")[-1]) + 1
        except Exception:
            seq = last.id + 1
    # ensure uniqueness if collision
    for _ in range(50):
        candidate = f"{prefix}{seq:06d}"
        if not Ticket.query.filter_by(ticket_number=candidate).first():
            return candidate
        seq += 1
    return f"{prefix}{uuid.uuid4().hex[:8].upper()}"


def allowed_file(filename, mimetype=None):
    if not filename or "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False
    if mimetype:
        if mimetype == "application/octet-stream":
            return True
        if not (mimetype in {"application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"} or any(mimetype.startswith(p) for p in ALLOWED_MIME_PREFIXES)):
            return False
    return True


def save_upload(file_storage, ticket=None, comment=None, uploader=None):
    filename = secure_filename(file_storage.filename or "")
    if not allowed_file(filename, file_storage.mimetype):
        raise ValueError("Unsupported attachment type")
    ext = filename.rsplit(".", 1)[1].lower() if "." in filename else "bin"
    stored_name = f"{uuid.uuid4().hex}.{ext}"
    upload_folder = Path(current_app.config["UPLOAD_FOLDER"])
    upload_folder.mkdir(parents=True, exist_ok=True)
    stored_path = upload_folder / stored_name
    file_storage.save(stored_path)
    size = stored_path.stat().st_size if stored_path.exists() else None
    if size is not None and size > current_app.config.get("MAX_CONTENT_LENGTH", 10 * 1024 * 1024):
        try:
            stored_path.unlink()
        except Exception:
            pass
        raise ValueError("Attachment too large")
    attachment = Attachment(
        ticket_id=ticket.id if ticket else (comment.ticket_id if comment else None),
        comment_id=comment.id if comment else None,
        uploaded_by_id=uploader.id if uploader else None,
        original_name=file_storage.filename or stored_name,
        stored_name=stored_name,
        stored_path=str(stored_path),
        mime_type=file_storage.mimetype,
        size_bytes=size,
    )
    db.session.add(attachment)
    return attachment


def can_view_ticket(user, ticket):
    if not user or not user.is_authenticated:
        return False
    if user.role == "board":
        return True
    return ticket.resident_id == user.id


def can_comment_on_ticket(user, ticket):
    if not user or not user.is_authenticated:
        return False
    if user.role == "board":
        return True
    return ticket.resident_id == user.id


def create_notification(user, event_type, subject, body):
    notif = NotificationOutbox(
        user_id=user.id if user else None,
        recipient_email=user.email if user else None,
        event_type=event_type,
        subject=subject,
        body=body,
        status="pending",
    )
    db.session.add(notif)
    return notif


def notify_ticket_event(ticket, event_type, subject, body, include_resident=True, include_board=False, exclude_user_id=None):
    recipients = {}
    if include_resident and ticket.resident:
        recipients[ticket.resident.id] = ticket.resident
    if include_board:
        for bm in User.query.filter_by(role="board", is_active=True).all():
            recipients[bm.id] = bm
    for uid, user in recipients.items():
        if exclude_user_id and uid == exclude_user_id:
            continue
        create_notification(user, event_type, subject, body)


def send_notification_email(notification):
    host = current_app.config.get("SMTP_HOST")
    from_addr = current_app.config.get("SMTP_FROM") or current_app.config.get("SMTP_USERNAME")
    to_addr = notification.recipient_email
    if not host or not from_addr or not to_addr:
        notification.status = "failed"
        notification.attempts = (notification.attempts or 0) + 1
        notification.last_error = "SMTP not configured or recipient missing"
        return False
    msg = EmailMessage()
    msg["Subject"] = notification.subject or notification.event_type
    msg["From"] = from_addr
    msg["To"] = to_addr
    msg.set_content(notification.body or "")
    try:
        port = int(current_app.config.get("SMTP_PORT", 587))
        use_tls = current_app.config.get("SMTP_USE_TLS", True)
        with smtplib.SMTP(host, port, timeout=10) as smtp:
            if use_tls:
                smtp.starttls()
            username = current_app.config.get("SMTP_USERNAME")
            password = current_app.config.get("SMTP_PASSWORD")
            if username:
                smtp.login(username, password or "")
            smtp.send_message(msg)
        notification.status = "sent"
        notification.attempts = (notification.attempts or 0) + 1
        notification.sent_at = datetime.utcnow()
        notification.last_error = None
        return True
    except Exception as e:
        notification.status = "failed"
        notification.attempts = (notification.attempts or 0) + 1
        notification.last_error = str(e)
        return False


def process_outbox(limit=50):
    pending = NotificationOutbox.query.filter_by(status="pending").order_by(NotificationOutbox.created_at.asc()).limit(limit).all()
    results = {"sent": 0, "failed": 0}
    for n in pending:
        ok = send_notification_email(n)
        results["sent" if ok else "failed"] += 1
    db.session.commit()
    return results


# Workflow helpers
STATUS_OPEN = "open"
STATUS_PROPOSED = "board_proposed"
STATUS_ACK = "resident_ack"
STATUS_CLOSED = "closed"


def can_propose_resolution(ticket):
    return ticket.status in {STATUS_OPEN, STATUS_PROPOSED, STATUS_ACK}


def propose_resolution(ticket, actor):
    if actor.role != "board":
        raise PermissionError("Only board members can propose resolution")
    if not can_propose_resolution(ticket):
        raise ValueError("Invalid status for proposal")
    before = ticket.status
    ticket.status = STATUS_PROPOSED
    ticket.board_proposed_at = datetime.utcnow()
    ticket.board_proposed_by_id = actor.id
    ticket.resident_ack_at = None
    ticket.updated_at = datetime.utcnow()
    return before


def acknowledge_resolution(ticket, actor):
    if actor.role != "resident" or actor.id != ticket.resident_id:
        raise PermissionError("Only the owning resident can acknowledge")
    if ticket.status != STATUS_PROPOSED:
        raise ValueError("Ticket must be in proposed state")
    before = ticket.status
    ticket.status = STATUS_ACK
    ticket.resident_ack_at = datetime.utcnow()
    ticket.updated_at = datetime.utcnow()
    return before


def close_ticket(ticket, actor):
    if actor.role != "board":
        raise PermissionError("Only board members can close tickets")
    if ticket.status != STATUS_ACK:
        raise ValueError("Resident acknowledgement required before close")
    before = ticket.status
    ticket.status = STATUS_CLOSED
    ticket.closed_at = datetime.utcnow()
    ticket.closed_by_id = actor.id
    ticket.updated_at = datetime.utcnow()
    return before
