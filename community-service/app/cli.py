import click
from flask import current_app

from . import db
from .models import User
from .services import log_audit


def register_cli(app):
    @app.cli.command("bootstrap-board")
    @click.option("--name", required=True, help="Board member name")
    @click.option("--email", required=True, help="Board member email")
    @click.option("--password", required=True, help="Board member password")
    def bootstrap_board(name, email, password):
        """Create the first board member account when none exists."""
        email_norm = email.strip().lower()
        existing_board = User.query.filter_by(role="board").first()
        if existing_board:
            click.echo("A board member already exists. Bootstrap is only for initial setup.")
            raise SystemExit(1)
        if User.query.filter_by(email=email_norm).first():
            click.echo("A user with this email already exists.")
            raise SystemExit(1)
        user = User(name=name.strip(), email=email_norm, role="board", is_active=True)
        user.set_password(password)
        db.session.add(user)
        db.session.flush()
        log_audit("user.bootstrap_board", actor_id=user.id, entity_type="user", entity_id=user.id, details={"email": user.email, "role": "board"})
        db.session.commit()
        click.echo(f"Created board member: {user.email}")

    @app.cli.command("send-notifications")
    @click.option("--limit", default=50, show_default=True)
    def send_notifications(limit):
        from .services import process_outbox
        results = process_outbox(limit=limit)
        click.echo(f"Sent: {results['sent']} Failed: {results['failed']}")
