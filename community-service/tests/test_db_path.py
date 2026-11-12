import os
import shutil
from pathlib import Path

from app import create_app, db


def test_relative_sqlite_database_url_resolved_from_different_cwd(tmp_path):
    project_root = Path(__file__).resolve().parent.parent
    nested = project_root / "data" / "_test_rel_cwd" / "nested.db"
    if nested.parent.exists():
        shutil.rmtree(nested.parent)
    old_cwd = os.getcwd()
    try:
        os.chdir(tmp_path)  # run from different working directory
        app = create_app({
            "TESTING": True,
            "SECRET_KEY": "test",
            "SQLALCHEMY_DATABASE_URI": "sqlite:///data/_test_rel_cwd/nested.db",
            "WTF_CSRF_ENABLED": False,
            "UPLOAD_FOLDER": str(tmp_path / "uploads"),
        })
        # resolved to project path and db can be used
        assert str(project_root / "data").replace("\\", "/") in app.config["SQLALCHEMY_DATABASE_URI"].replace("\\", "/")
        with app.app_context():
            db.create_all()
            db.session.execute(db.text("SELECT 1"))
        assert nested.exists() or nested.with_suffix(".db").exists() or nested.parent.exists()
    finally:
        os.chdir(old_cwd)
        if nested.parent.exists():
            shutil.rmtree(nested.parent, ignore_errors=True)


def test_missing_parent_directory_created_for_sqlite_file(tmp_path):
    db_path = tmp_path / "missing" / "subdir" / "app.db"
    assert not db_path.parent.exists()
    app = create_app({
        "TESTING": True,
        "SECRET_KEY": "test",
        "SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_path.as_posix()}",
        "WTF_CSRF_ENABLED": False,
        "UPLOAD_FOLDER": str(tmp_path / "uploads"),
    })
    assert db_path.parent.exists()
    with app.app_context():
        db.create_all()
        db.session.execute(db.text("SELECT 1"))
    assert db_path.exists()
