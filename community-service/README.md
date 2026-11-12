# Community Service Ticketing App

A Flask + SQLite web application for residents to raise community service issues as tickets and for board members to manage, discuss, and resolve them.

## Features (planned/implemented by OpenSpec change `community-ticketing-app`)
- Role-based login for residents and board members
- Board-managed user creation and bootstrap of first board member
- Resident ticket creation with unique ticket numbers, categories, priority, comments/replies, and attachments
- Enforced resolution workflow: board proposes resolution, resident acknowledges, board closes (gated)
- Email notification outbox + SMTP sender (non-blocking when unconfigured)
- Append-only audit history

## Project layout
- `app/` - application code (auth, routes, models, services)
- `templates/`, `static/` - UI
- `data/` - SQLite database (`community.db`) and uploads (`data/uploads/`)
- `migrations/` - database migrations
- `tests/` - automated tests
- `openspec/` - OpenSpec artifacts

## Setup
1. Create and activate a virtual environment (recommended).
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create configuration:
   ```bash
   copy .env.example .env
   ```
   Edit `.env` and set `SECRET_KEY` (and SMTP values if you want email delivery).
   - **Database:** by default the app uses SQLite at `data/community.db` in this project folder. If you set `DATABASE_URL`, file-based SQLite relative paths (e.g. `sqlite:///data/community.db`) are resolved relative to the project directory and the database parent directory is created automatically; absolute paths are honored; `sqlite:///:memory:` is supported for tests.
4. Initialize/migrate the database (creates `data/community.db`):
   ```bash
   flask --app run.py db upgrade
   ```
   (During development you can also run the app which may ensure tables in test contexts; migrations are the documented path.)
5. Bootstrap the first board member (required before login/user management):
   ```bash
   flask --app run.py bootstrap-board --name "Board Admin" --email "board@example.com" --password "ChangeMe123!"
   ```
6. Run the app:
   ```bash
   flask --app run.py run
   ```
   or `python run.py`

## Data folder
- SQLite DB: `data/community.db`
- Attachments: `data/uploads/`
Back up the entire `data/` folder to preserve application state.

## SMTP notes
If SMTP settings are not configured or delivery fails, the app records notifications in the outbox and does not block core actions. Configure `SMTP_*` values in `.env` to enable delivery.

## Tests
```bash
pytest -q
```
