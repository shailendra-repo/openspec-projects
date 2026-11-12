import os
import tempfile

import pytest

from app import create_app, db
from app.models import Category, User


@pytest.fixture()
def app_instance(tmp_path):
    db_path = tmp_path / "test.db"
    upload_path = tmp_path / "uploads"
    upload_path.mkdir()
    app = create_app({
        "TESTING": True,
        "SECRET_KEY": "test-secret",
        "SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_path.as_posix()}",
        "WTF_CSRF_ENABLED": False,
        "UPLOAD_FOLDER": str(upload_path),
        "SMTP_HOST": "",
    })
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app_instance):
    return app_instance.test_client()


@pytest.fixture()
def runner(app_instance):
    return app_instance.test_cli_runner()


def create_user(name, email, password, role="resident", is_active=True):
    user = User(name=name, email=email, role=role, is_active=is_active)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture()
def board_user(app_instance):
    with app_instance.app_context():
        u = create_user("Board One", "board@example.com", "password123", role="board")
        return {"id": u.id, "email": u.email, "password": "password123"}


@pytest.fixture()
def resident_user(app_instance):
    with app_instance.app_context():
        u = create_user("Resident One", "resident@example.com", "password123", role="resident")
        return {"id": u.id, "email": u.email, "password": "password123"}


@pytest.fixture()
def other_resident(app_instance):
    with app_instance.app_context():
        u = create_user("Resident Two", "resident2@example.com", "password123", role="resident")
        return {"id": u.id, "email": u.email, "password": "password123"}


@pytest.fixture()
def category(app_instance):
    with app_instance.app_context():
        cat = Category(name="Plumbing", is_active=True)
        db.session.add(cat)
        db.session.commit()
        return {"id": cat.id, "name": cat.name}


def login(client, email, password):
    return client.post("/login", data={"email": email, "password": password}, follow_redirects=True)
