from flask import Flask, request, jsonify
from flask_cors import CORS
import json, os, re
from collections import defaultdict, Counter

APP_DIR = os.path.dirname(__file__)
ALIASES_PATH = os.path.join(APP_DIR, "data.json")
COMBINED_PATH = os.path.join(APP_DIR, "combined_chapters_all_books_1_86_merged_final.json")
CHAP2BOOK_PATH = os.path.join(APP_DIR, "chapter_to_book.json")
GROUPED_PATH = os.path.join(APP_DIR, "middlemarch_characters_grouped.json")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

state = {
    "aliases_full": [],
    "alias_index": {},              # alias (lower) -> canonical name
    "combined": {},                 # 'Chapter N' -> {'characters': [...], 'interactions': [...]}
    "interactions_by_chapter": {},  # 'Chapter N' -> [...]
    "chapters": {},                 # derived: 'Chapter N' -> unique list of canonical names
    "chapter_to_book": {},          # 'Chapter N' -> book number/label
    "character_groups": {}          # section -> [names]
}

# ------------ helpers ------------

def clean_name(s: str) -> str:
    if not s:
        return ""
    # normalize whitespace and punctuation spacing
    s = re.sub(r"\s+", " ", s.strip())
    return s

def canonicalize(name: str) -> str:
    if not name:
        return ""
    key = name.strip().lower()
    return state["alias_index"].get(key, clean_name(name))

def number_from_chapter_key(ch_key: str) -> int:
    # 'Chapter 12' -> 12
    m = re.search(r"(\d+)$", str(ch_key))
    return int(m.group(1)) if m else -1

def load_aliases():
    if not os.path.exists(ALIASES_PATH):
        print(f"Warning: {ALIASES_PATH} not found")
        return
    with open(ALIASES_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    state["aliases_full"] = data.get("aliases_full", [])
    # Build alias index
    idx = {}
    for entry in state["aliases_full"]:
        canon = entry.get("canonical_name", "").strip()
        for a in entry.get("aliases", []):
            idx[a.strip().lower()] = canon
        # include canonical itself
        if canon:
            idx[canon.lower()] = canon
    state["alias_index"] = idx
    print(f"Loaded {len(state['aliases_full'])} alias entries")

def load_combined():
    if not os.path.exists(COMBINED_PATH):
        print(f"Warning: {COMBINED_PATH} not found")
        return
    with open(COMBINED_PATH, "r", encoding="utf-8") as f:
        combined = json.load(f)
    # Expect dict with 'Chapter N' keys
    if isinstance(combined, dict):
        state["combined"] = combined
        # interactions_by_chapter
        ibc = {}
        for ch, obj in combined.items():
            if isinstance(obj, dict):
                ibc[ch] = obj.get("interactions", []) or []
            else:
                ibc[ch] = []
        state["interactions_by_chapter"] = ibc
        print(f"Loaded {len(state['combined'])} chapters")
    else:
        state["combined"] = {}
        state["interactions_by_chapter"] = {}

def load_chapter_to_book():
    if not os.path.exists(CHAP2BOOK_PATH):
        print(f"Warning: {CHAP2BOOK_PATH} not found")
        return
    with open(CHAP2BOOK_PATH, "r", encoding="utf-8") as f:
        mapping = json.load(f)
    # normalize to 'Chapter N' keys
    out = {}
    for k, v in mapping.items():
        try:
            n = int(k)
            out[f"Chapter {n}"] = v
        except Exception:
            # maybe key already 'Chapter N'
            out[str(k)] = v
    state["chapter_to_book"] = out
    print(f"Loaded chapter-to-book mapping for {len(out)} chapters")


def load_grouped_characters():
    if not os.path.exists(GROUPED_PATH):
        print(f"Warning: {GROUPED_PATH} not found")
        return
    with open(GROUPED_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    state["character_groups"] = data
    print(f"Loaded {len(data)} character groups")


def rebuild_chapters_from_interactions():
    chapters = {}
    for ch, lst in state.get("interactions_by_chapter", {}).items():
        names = []
        for it in lst or []:
            a = canonicalize(it.get("character_1", ""))
            b = canonicalize(it.get("character_2", ""))
            if a: names.append(a)
            if b: names.append(b)
        uniq = sorted(set(clean_name(x) for x in names if clean_name(x)))
        chapters[ch] = uniq
    # Prefer existing characters if present, otherwise use derived
    for ch, obj in state.get("combined", {}).items():
        if isinstance(obj, dict) and obj.get("characters"):
            chapters.setdefault(ch, obj["characters"])
    state["chapters"] = chapters
    print(f"Rebuilt chapters data for {len(chapters)} chapters")

def select_chapter_keys(start=None, end=None, book=None):
    keys = list(state["chapters"].keys())
    # numeric filter
    if start is not None or end is not None:
        s = int(start) if start not in (None, "") else None
        e = int(end) if end not in (None, "") else None
        sel = []
        for k in keys:
            n = number_from_chapter_key(k)
            if n < 0: 
                continue
            if s is not None and n < s:
                continue
            if e is not None and n > e:
                continue
            sel.append(k)
        keys = sel
    # book filter
    if book not in (None, "", "all"):
        keys = [k for k in keys if str(state["chapter_to_book"].get(k, "")).lower() == str(book).lower()]
    # stable order by chapter number
    keys.sort(key=number_from_chapter_key)
    return keys

def build_graph(chapter_keys, min_conn=1):
    # nodes: canonical names appearing in selected chapters
    # links: aggregated counts over interactions (undirected)
    names = set()
    edge_counter = Counter()

    for ch in chapter_keys:
        interactions = state["interactions_by_chapter"].get(ch, [])
        for it in interactions:
            a = canonicalize(it.get("character_1", ""))
            b = canonicalize(it.get("character_2", ""))
            if not a or not b or a == b:
                continue
            # undirected key
            u, v = sorted([a, b])
            edge_counter[(u, v)] += 1
            names.add(u); names.add(v)

    # prune edges by min_conn
    edges = []
    for (u, v), w in edge_counter.items():
        if w >= max(1, int(min_conn)):
            edges.append({"source": u, "target": v, "weight": int(w)})

    nodes = [{"id": n} for n in sorted(names)]
    print(f"Built graph: {len(nodes)} nodes, {len(edges)} edges")
    return {"nodes": nodes, "links": edges}

# ------------ load on startup ------------

print("Loading data...")
load_aliases()
load_combined()
load_chapter_to_book()
load_grouped_characters()
rebuild_chapters_from_interactions()
print("Data loading complete!")

# ------------ routes ------------

@app.get("/")
def home():
    return jsonify({
        "status": "running",
        "chapters_loaded": len(state["chapters"]),
        "aliases_loaded": len(state["aliases_full"]),
        "character_groups_loaded": len(state.get("character_groups", {}))
    })

@app.get("/aliases")
def get_aliases():
    return jsonify({"aliases_full": state["aliases_full"]})

@app.get("/characters/grouped")
def get_grouped_characters():
    if not state.get("character_groups"):
        return jsonify({"error": "Character groups not loaded"}), 404
    return jsonify(state["character_groups"])

@app.get("/interactions")
def get_interactions():
    ch = request.args.get("chapter", "").strip()
    start = request.args.get("start", "").strip()
    end = request.args.get("end", "").strip()
    book = request.args.get("book", "").strip()

    if ch:
        return jsonify({ch: state["interactions_by_chapter"].get(ch, [])})

    keys = select_chapter_keys(start or None, end or None, book or None)
    out = {k: state["interactions_by_chapter"].get(k, []) for k in keys}
    return jsonify(out)

@app.get("/graph")
def get_graph():
    start = request.args.get("start", "").strip()
    end = request.args.get("end", "").strip()
    book = request.args.get("book", "").strip()
    try:
        min_conn = int(request.args.get("minConn", "1"))
    except Exception:
        min_conn = 1

    keys = select_chapter_keys(start or None, end or None, book or None)
    print(f"Graph request: book={book}, start={start}, end={end}, minConn={min_conn}")
    print(f"Selected {len(keys)} chapters: {keys[:5]}..." if len(keys) > 5 else f"Selected chapters: {keys}")
    
    graph = build_graph(keys, min_conn=min_conn)
    meta = {
        "chapters": keys,
        "minConn": min_conn,
        "book": book or "all"
    }
    return jsonify({"graph": graph, "meta": meta})

if __name__ == "__main__":
    # Install flask-cors first: pip install flask-cors
    # Run with:  python app.py
    # then call endpoints like:
    #   http://127.0.0.1:5000/
    #   http://127.0.0.1:5000/aliases
    #   http://127.0.0.1:5000/characters/grouped
    #   http://127.0.0.1:5000/interactions?start=1&end=12
    #   http://127.0.0.1:5000/graph?book=1&start=1&end=12&minConn=2
    app.run(host="0.0.0.0", port=5000, debug=True)
