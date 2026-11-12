import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_wtf import CSRFProtect
from sqlalchemy import event
from sqlalchemy.engine import Engine

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
csrf = CSRFProtect()


def _normalize_sqlite_uri(db_uri: str, base_dir: Path) -> str:
    if not db_uri.startswith("sqlite"):
        return db_uri
    # keep in-memory databases unchanged
    if db_uri in {"sqlite://", "sqlite:///:memory:"} or ":memory:" in db_uri:
        return db_uri
    # file-based sqlite URI
    if db_uri.startswith("sqlite:////"):
        # absolute path form sqlite:////abs/path
        path_part = db_uri[len("sqlite:////") - 1 :]  # keep leading slash
        db_path = Path(path_part)
    elif db_uri.startswith("sqlite:///"):
        path_part = db_uri[len("sqlite:///"):]
        # Windows drive path like C:/... or C:\...
        if len(path_part) >= 2 and path_part[1] == ":":
            db_path = Path(path_part)
        else:
            db_path = Path(path_part)
            if not db_path.is_absolute():
                db_path = (base_dir / db_path).resolve()
    else:
        return db_uri

    # ensure absolute, normalized path for sqlite URI
    if not db_path.is_absolute():
        db_path = (base_dir / db_path).resolve()
    else:
        # resolve to normalize (best effort)
        try:
            db_path = db_path.resolve()
        except Exception:
            db_path = Path(os.path.abspath(str(db_path)))
    db_path.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{db_path.as_posix()}"


@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    try:
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
    finally:
        cursor.close()


def create_app(test_config=None):
    base_dir = Path(__file__).resolve().parent.parent
    load_dotenv(base_dir / ".env")

    app = Flask(__name__, template_folder=str(base_dir / "templates"), static_folder=str(base_dir / "static"))

    data_dir = base_dir / "data"
    uploads_dir = data_dir / "uploads"
    data_dir.mkdir(parents=True, exist_ok=True)
    uploads_dir.mkdir(parents=True, exist_ok=True)

    default_db_path = data_dir / "community.db"
    db_uri = os.getenv("DATABASE_URL")
    if not db_uri:
        db_uri = f"sqlite:///{default_db_path.as_posix()}"
    db_uri = _normalize_sqlite_uri(db_uri, base_dir)

    app.config.from_mapping(
        SECRET_KEY=os.getenv("SECRET_KEY", "dev-secret-key-change-me"),
        SQLALCHEMY_DATABASE_URI=db_uri,
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        UPLOAD_FOLDER=str(uploads_dir),
        MAX_CONTENT_LENGTH=10 * 1024 * 1024,
        WTF_CSRF_TIME_LIMIT=None,
        SMTP_HOST=os.getenv("SMTP_HOST", ""),
        SMTP_PORT=int(os.getenv("SMTP_PORT", "587") or 587),
        SMTP_USERNAME=os.getenv("SMTP_USERNAME", ""),
        SMTP_PASSWORD=os.getenv("SMTP_PASSWORD", ""),
        SMTP_FROM=os.getenv("SMTP_FROM", ""),
        SMTP_USE_TLS=os.getenv("SMTP_USE_TLS", "true").lower() in {"1", "true", "yes", "on"},
    )

    if test_config:
        app.config.update(test_config)
        # ensure upload dir exists for tests if overridden
        Path(app.config["UPLOAD_FOLDER"]).mkdir(parents=True, exist_ok=True)

    # Normalize sqlite database URI after config overrides and ensure DB directory exists
    app.config["SQLALCHEMY_DATABASE_URI"] = _normalize_sqlite_uri(app.config.get("SQLALCHEMY_DATABASE_URI", ""), base_dir)

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    csrf.init_app(app)

    login_manager.login_view = "auth.login"
    login_manager.login_message_category = "error"

    from . import models  # noqa: F401
    from .auth import auth_bp
    from .routes import main_bp
    from .cli import register_cli

    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    register_cli(app)

    @app.route("/health")
    def health():
        return {"status": "ok"}

    with app.app_context():
        # For test/dev convenience ensure tables exist if migrations not yet run in this context
        if app.config.get("SQLALCHEMY_DATABASE_URI", "").startswith("sqlite:///") and app.config.get("TESTING"):
            db.create_all()

    return app
