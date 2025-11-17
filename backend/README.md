# Middlemarch Character Network — Flask Backend

A minimal Flask API that mirrors the Express version's endpoints so your React
frontend can stay the same.

## Endpoints
- `GET  /chapters` → returns the chapter→names map
- `POST /chapters` → accepts JSON (object or array of {chapter,name}) **or** CSV text (`Content-Type: text/csv`) with headers `chapter,name`
- `GET  /aliases`  → returns an array of canonical names
- `POST /aliases`  → accepts JSON array or single object `{ "canonical_name": "Will Ladislaw", "aliases": [...] }`
- `GET  /graph`    → query: `mode=all|single|range` and optional `single`, `start`, `end`, `minConn`

The graph response is:
```json
{ "nodes": [{ "id": "...", "chapterCount": 3, "category": "major", "connections": 7 }],
  "links": [{ "source": "...", "target": "...", "weight": 4 }] }
```

## Quick start (Windows PowerShell)
```powershell
cd middlemarch_flask_backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:FLASK_APP="app.py"
flask run --port 3001
```

## Quick start (Linux / WSL)
```bash
cd middlemarch_flask_backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export FLASK_APP=app.py
flask run --port 3001 --host 0.0.0.0
```

> The server persists uploads to `data.json` in this folder.
