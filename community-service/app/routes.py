import os
from datetime import datetime
from pathlib import Path

from flask import Blueprint, abort, current_app, flash, redirect, render_template, request, send_file, url_for
from flask_login import current_user, login_required

from . import db
from .auth import board_required
from .models import Attachment, AuditEvent, Category, Comment, Ticket, User
from .services import (
    STATUS_ACK,
    STATUS_CLOSED,
    STATUS_OPEN,
    STATUS_PROPOSED,
    acknowledge_resolution,
    allowed_file,
    can_comment_on_ticket,
    can_propose_resolution,
    can_view_ticket,
    close_ticket,
    generate_ticket_number,
    log_audit,
    notify_ticket_event,
    propose_resolution,
    save_upload,
)

main_bp = Blueprint("main", __name__)


@main_bp.route("/")
def index():
    if current_user.is_authenticated:
        return redirect(url_for("main.dashboard"))
    return render_template("index.html")


@main_bp.route("/dashboard")
@login_required
def dashboard():
    if current_user.role == "board":
        tickets = Ticket.query.order_by(Ticket.created_at.desc()).all()
    else:
        tickets = Ticket.query.filter_by(resident_id=current_user.id).order_by(Ticket.created_at.desc()).all()
    return render_template("dashboard.html", tickets=tickets)


# --- User management (board only) ---
@main_bp.route("/users")
@board_required
def users():
    all_users = User.query.order_by(User.created_at.desc()).all()
    return render_template("users.html", users=all_users)


@main_bp.route("/users/create", methods=["GET", "POST"])
@board_required
def create_user():
    if request.method == "POST":
        name = (request.form.get("name") or "").strip()
        email = (request.form.get("email") or "").strip().lower()
        role = (request.form.get("role") or "resident").strip()
        password = request.form.get("password") or ""
        is_active = bool(request.form.get("is_active"))
        if role not in {"resident", "board"}:
            flash("Invalid role.", "error")
            return render_template("user_form.html", form=request.form)
        if not name or not email or not password:
            flash("Name, email, and password are required.", "error")
            return render_template("user_form.html", form=request.form)
        if User.query.filter_by(email=email).first():
            flash("Email already exists.", "error")
            return render_template("user_form.html", form=request.form)
        user = User(name=name, email=email, role=role, is_active=is_active, created_by_id=current_user.id)
        user.set_password(password)
        db.session.add(user)
        db.session.flush()
        log_audit("user.created", actor_id=current_user.id, entity_type="user", entity_id=user.id,
                  details={"email": user.email, "role": user.role, "is_active": user.is_active})
        db.session.commit()
        flash("User created.", "success")
        return redirect(url_for("main.users"))
    return render_template("user_form.html", form={})


# --- Categories (board only) ---
@main_bp.route("/categories", methods=["GET", "POST"])
@board_required
def categories():
    if request.method == "POST":
        action = request.form.get("action")
        if action == "create":
            name = (request.form.get("name") or "").strip()
            if not name:
                flash("Category name required.", "error")
            elif Category.query.filter_by(name=name).first():
                flash("Category already exists.", "error")
            else:
                cat = Category(name=name, is_active=True)
                db.session.add(cat)
                db.session.flush()
                log_audit("category.created", actor_id=current_user.id, entity_type="category", entity_id=cat.id, details={"name": name})
                db.session.commit()
                flash("Category created.", "success")
        elif action == "toggle":
            cat_id = request.form.get("category_id")
            cat = db.session.get(Category, int(cat_id)) if cat_id else None
            if cat:
                cat.is_active = not cat.is_active
                log_audit("category.toggled", actor_id=current_user.id, entity_type="category", entity_id=cat.id, details={"name": cat.name, "is_active": cat.is_active})
                db.session.commit()
                flash("Category updated.", "success")
        return redirect(url_for("main.categories"))
    cats = Category.query.order_by(Category.name.asc()).all()
    return render_template("categories.html", categories=cats)


# --- Tickets ---
@main_bp.route("/tickets/new", methods=["GET", "POST"])
@login_required
def new_ticket():
    if current_user.role != "resident":
        abort(403)
    cats = Category.query.filter_by(is_active=True).order_by(Category.name.asc()).all()
    if request.method == "POST":
        title = (request.form.get("title") or "").strip()
        description = (request.form.get("description") or "").strip()
        category_id = request.form.get("category_id") or None
        priority = (request.form.get("priority") or "medium").strip()
        if priority not in {"low", "medium", "high", "urgent"}:
            priority = "medium"
        if not title or not description:
            flash("Title and description are required.", "error")
            return render_template("ticket_form.html", categories=cats, form=request.form)
        ticket = Ticket(
            ticket_number=generate_ticket_number(),
            resident_id=current_user.id,
            title=title,
            description=description,
            category_id=int(category_id) if category_id else None,
            priority=priority,
            status=STATUS_OPEN,
        )
        db.session.add(ticket)
        db.session.flush()
        # attachments
        files = request.files.getlist("attachments")
        for f in files:
            if f and f.filename:
                try:
                    att = save_upload(f, ticket=ticket, uploader=current_user)
                    log_audit("attachment.added", actor_id=current_user.id, ticket_id=ticket.id, entity_type="attachment", entity_id=att.id, details={"original_name": att.original_name, "context": "ticket"})
                except ValueError as e:
                    db.session.rollback()
                    flash(str(e), "error")
                    return render_template("ticket_form.html", categories=cats, form=request.form)
        log_audit("ticket.created", actor_id=current_user.id, ticket_id=ticket.id, entity_type="ticket", entity_id=ticket.id,
                  details={"ticket_number": ticket.ticket_number, "title": title, "priority": priority, "category_id": ticket.category_id})
        notify_ticket_event(ticket, "ticket.created", f"New ticket {ticket.ticket_number}", f"Ticket {ticket.ticket_number} was created: {title}", include_resident=True, include_board=True, exclude_user_id=current_user.id)
        db.session.commit()
        flash(f"Ticket {ticket.ticket_number} created.", "success")
        return redirect(url_for("main.ticket_detail", ticket_id=ticket.id))
    return render_template("ticket_form.html", categories=cats, form={})


@main_bp.route("/tickets/<int:ticket_id>")
@login_required
def ticket_detail(ticket_id):
    ticket = db.session.get(Ticket, ticket_id)
    if not ticket or not can_view_ticket(current_user, ticket):
        abort(404)
    comments = Comment.query.filter_by(ticket_id=ticket.id).order_by(Comment.created_at.asc()).all()
    attachments = Attachment.query.filter_by(ticket_id=ticket.id).order_by(Attachment.created_at.asc()).all()
    audit_events = []
    if can_view_ticket(current_user, ticket):
        audit_events = AuditEvent.query.filter_by(ticket_id=ticket.id).order_by(AuditEvent.created_at.asc()).all()
    # build threaded view helpers
    by_parent = {}
    roots = []
    for c in comments:
        by_parent.setdefault(c.parent_comment_id, []).append(c)
    roots = by_parent.get(None, [])
    return render_template("ticket_detail.html", ticket=ticket, comments=comments, roots=roots, by_parent=by_parent, attachments=attachments, audit_events=audit_events)


@main_bp.route("/tickets/<int:ticket_id>/comment", methods=["POST"])
@login_required
def add_comment(ticket_id):
    ticket = db.session.get(Ticket, ticket_id)
    if not ticket or not can_comment_on_ticket(current_user, ticket):
        abort(403)
    body = (request.form.get("body") or "").strip()
    parent_id = request.form.get("parent_comment_id") or None
    if not body:
        flash("Comment cannot be empty.", "error")
        return redirect(url_for("main.ticket_detail", ticket_id=ticket.id))
    parent = None
    if parent_id:
        parent = db.session.get(Comment, int(parent_id))
        if not parent or parent.ticket_id != ticket.id:
            flash("Invalid parent comment.", "error")
            return redirect(url_for("main.ticket_detail", ticket_id=ticket.id))
        # residents reply over board comments in their own tickets
        if current_user.role == "resident" and parent.author.role != "board":
            flash("Residents can reply over board comments.", "error")
            return redirect(url_for("main.ticket_detail", ticket_id=ticket.id))
    comment = Comment(ticket_id=ticket.id, author_id=current_user.id, parent_comment_id=parent.id if parent else None, body=body)
    db.session.add(comment)
    db.session.flush()
    files = request.files.getlist("attachments")
    for f in files:
        if f and f.filename:
            try:
                att = save_upload(f, comment=comment, uploader=current_user)
                log_audit("attachment.added", actor_id=current_user.id, ticket_id=ticket.id, entity_type="attachment", entity_id=att.id, details={"original_name": att.original_name, "context": "comment", "comment_id": comment.id})
            except ValueError as e:
                db.session.rollback()
                flash(str(e), "error")
                return redirect(url_for("main.ticket_detail", ticket_id=ticket.id))
    log_audit("comment.added", actor_id=current_user.id, ticket_id=ticket.id, entity_type="comment", entity_id=comment.id,
              details={"parent_comment_id": parent.id if parent else None})
    # notifications
    if current_user.role == "board":
        notify_ticket_event(ticket, "comment.added", f"Update on {ticket.ticket_number}", f"A board member commented on ticket {ticket.ticket_number}.", include_resident=True, include_board=False, exclude_user_id=None)
    else:
        notify_ticket_event(ticket, "comment.added", f"Resident reply on {ticket.ticket_number}", f"Resident replied on ticket {ticket.ticket_number}.", include_resident=False, include_board=True, exclude_user_id=current_user.id)
    db.session.commit()
    flash("Comment added.", "success")
    return redirect(url_for("main.ticket_detail", ticket_id=ticket.id))


# --- Workflow actions ---
@main_bp.route("/tickets/<int:ticket_id>/propose", methods=["POST"])
@board_required
def propose(ticket_id):
    ticket = db.session.get(Ticket, ticket_id)
    if not ticket:
        abort(404)
    try:
        before = propose_resolution(ticket, current_user)
        log_audit("ticket.resolution_proposed", actor_id=current_user.id, ticket_id=ticket.id, entity_type="ticket", entity_id=ticket.id,
                  details={"from": before, "to": ticket.status})
        notify_ticket_event(ticket, "resolution.proposed", f"Resolution proposed for {ticket.ticket_number}", f"A resolution has been proposed for ticket {ticket.ticket_number}. Please review and acknowledge if accepted.", include_resident=True, include_board=True, exclude_user_id=current_user.id)
        db.session.commit()
        flash("Resolution proposed.", "success")
    except Exception as e:
        db.session.rollback()
        flash(str(e), "error")
    return redirect(url_for("main.ticket_detail", ticket_id=ticket.id))


@main_bp.route("/tickets/<int:ticket_id>/acknowledge", methods=["POST"])
@login_required
def acknowledge(ticket_id):
    ticket = db.session.get(Ticket, ticket_id)
    if not ticket or not can_view_ticket(current_user, ticket):
        abort(404)
    try:
        before = acknowledge_resolution(ticket, current_user)
        log_audit("ticket.resident_acknowledged", actor_id=current_user.id, ticket_id=ticket.id, entity_type="ticket", entity_id=ticket.id,
                  details={"from": before, "to": ticket.status})
        notify_ticket_event(ticket, "resident.acknowledged", f"Resident acknowledged {ticket.ticket_number}", f"The resident acknowledged the proposed resolution for ticket {ticket.ticket_number}.", include_resident=False, include_board=True, exclude_user_id=None)
        db.session.commit()
        flash("Resolution acknowledged.", "success")
    except Exception as e:
        db.session.rollback()
        flash(str(e), "error")
    return redirect(url_for("main.ticket_detail", ticket_id=ticket.id))


@main_bp.route("/tickets/<int:ticket_id>/close", methods=["POST"])
@board_required
def close(ticket_id):
    ticket = db.session.get(Ticket, ticket_id)
    if not ticket:
        abort(404)
    try:
        before = close_ticket(ticket, current_user)
        log_audit("ticket.closed", actor_id=current_user.id, ticket_id=ticket.id, entity_type="ticket", entity_id=ticket.id,
                  details={"from": before, "to": ticket.status})
        notify_ticket_event(ticket, "ticket.closed", f"Ticket {ticket.ticket_number} closed", f"Ticket {ticket.ticket_number} has been closed.", include_resident=True, include_board=True, exclude_user_id=current_user.id)
        db.session.commit()
        flash("Ticket closed.", "success")
    except Exception as e:
        db.session.rollback()
        flash(str(e), "error")
    return redirect(url_for("main.ticket_detail", ticket_id=ticket.id))


# --- Attachments ---
@main_bp.route("/attachments/<int:attachment_id>")
@login_required
def download_attachment(attachment_id):
    att = db.session.get(Attachment, attachment_id)
    if not att or not att.ticket_id:
        abort(404)
    ticket = db.session.get(Ticket, att.ticket_id)
    if not ticket or not can_view_ticket(current_user, ticket):
        abort(403)
    path = Path(att.stored_path)
    uploads_root = Path(current_app.config["UPLOAD_FOLDER"]).resolve()
    try:
        resolved = path.resolve()
        if uploads_root not in resolved.parents and resolved != uploads_root:
            abort(403)
    except Exception:
        abort(403)
    if not path.exists():
        abort(404)
    return send_file(path, as_attachment=True, download_name=att.original_name)


# --- Audit ---
@main_bp.route("/tickets/<int:ticket_id>/audit")
@login_required
def ticket_audit(ticket_id):
    ticket = db.session.get(Ticket, ticket_id)
    if not ticket or not can_view_ticket(current_user, ticket):
        abort(404)
    events = AuditEvent.query.filter_by(ticket_id=ticket.id).order_by(AuditEvent.created_at.asc()).all()
    return render_template("audit_timeline.html", ticket=ticket, events=events)
