# server.py
import sqlite3
from flask import Flask, request, jsonify, session, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "pg_life.db"

app = Flask(__name__, static_folder="static", static_url_path="/static")
app.secret_key = "replace-this-with-a-secure-random-string"  
CORS(app, supports_credentials=True)

SAMPLE_PGS = [
    {"id": 1, "name": "Sharma PG - Near Station", "city": "Chamba", "type": "single", "price": 4500,
     "thumb": "https://th.bing.com/th/id/OIP.lj_0TW1XnKHfyoekb5YuHQHaHa?w=122&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
     "rating": 4.6, "fac": ["wifi", "food"]},

    {"id": 2, "name": "Chandel PG - Gandhi Chowk", "city": "Hamirpur", "type": "double", "price": 4800,
     "thumb": "https://th.bing.com/th/id/OIP.YxxscEvNmwvtKVTQzuAtfAHaFj?w=218&h=183&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
     "rating": 4.2, "fac": ["wifi", "laundry"]},

    {"id": 3, "name": "Sunrise PG - Near Mall Road", "city": "Solan", "type": "sharing", "price": 3500,
     "thumb": "https://www.bing.com/th/id/OIP.-jrjNKtprzkWRJMo3H6-1QHaFj?w=264&h=211&c=8&rs=1&qlt=90&o=6&dpr=1.3&pid=3.1&rm=2",
     "rating": 4.0, "fac": ["wifi","food"]},

    {"id": 4, "name": "Ballers PG", "city": "Baddi", "type": "double", "price": 5200,
     "thumb": "https://th.bing.com/th/id/OIP.MYT1DwB3LnioGFoFEbtvEQHaE8?w=246&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
     "rating": 4.4, "fac": ["ac", "food"]},

    {"id": 5, "name": "Hoopers PG", "city": "Sunder Nagar", "type": "sharing", "price": 3800,
     "thumb": "https://th.bing.com/th/id/OIP.ZVz86ddufMRW85B42K7p0gHaEK?w=321&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
     "rating": 3.9, "fac": ["laundry","food",]},

    {"id": 6, "name": "Zone Out PG", "city": "Una", "type": "single", "price": 4800,
     "thumb": "https://th.bing.com/th/id/OIP.YpnLc4ZwaNmnUAfopLGxJwHaE8?w=273&h=182&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
     "rating": 4.7, "fac": ["wifi", "ac", "laundry", "food"]},

    {"id": 7, "name": "Good Life PG", "city": "Kullu", "type": "double", "price": 5600,
     "thumb": "https://th.bing.com/th/id/OIP.Pudub9HtjDFOIPg3aBJm_QHaE8?w=302&h=201&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
     "rating": 4.3, "fac": ["wifi", "gym", "food"]},

    {"id": 8, "name": "Khems PG", "city": "Mandi", "type": "triple", "price": 6900,
     "thumb": "https://th.bing.com/th/id/OIP.w1znmUvfu1zoKUftkiQ0ewHaE8?w=302&h=201&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
     "rating": 4.7, "fac": ["wifi", "ac", "laundry", "food"]},

    {"id": 9, "name": "Elite Stay PG", "city": "Shimla", "type": "double", "price": 5000,
     "thumb": "https://th.bing.com/th/id/OIP.CiVkPgZdfHpMUsB2zfgl5AHaE8?w=238&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
     "rating": 4.5, "fac": ["wifi", "laundry", "food"]},

    {"id": 10, "name": "Mountain Vally PG", "city": "Manali", "type": "single", "price": 4700,
     "thumb": "https://th.bing.com/th/id/OIP.kpeMOTklr2RzHUoWsExIiwHaE8?w=238&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
     "rating": 4.4, "fac": ["wifi", "gym", "ac"]},

    {"id": 11, "name": "Comfort Hub PG", "city": "Chandigarh", "type": "sharing", "price": 3600,
     "thumb": "https://th.bing.com/th/id/OIP.9pPgSNGh0o-mgteVQ2lmGwHaFr?w=241&h=185&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
     "rating": 4.1, "fac": ["laundry", "food"]},

    {"id": 12, "name": "Green Hill PG", "city": "Dharmshala", "type": "double", "price": 5100,
     "thumb": "https://th.bing.com/th/id/OIP.HFJ_zPWfiaZ6CJ0Vt2l6nAHaFj?w=242&h=182&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
     "rating": 4.6, "fac": ["wifi", "ac", "gym", "food"]}
]





def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if not DB_PATH.exists():
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT
        )
        """)
        cur.execute("""
        CREATE TABLE bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            pg_id INTEGER NOT NULL,
            qty INTEGER NOT NULL DEFAULT 1,
            amount INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """)
        conn.commit()
        conn.close()
        print("Initialized DB at", DB_PATH)

@app.route("/")
def index():
    # serve the main static file
    return send_from_directory("static", "index.html")

# --- Auth ---
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    name = data.get("name", "").strip()

    if not email or not password:
        return jsonify({"ok": False, "error": "Email and password required."}), 400

    pw_hash = generate_password_hash(password)
    conn = get_db()
    try:
        conn.execute("INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)", (email, pw_hash, name))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"ok": False, "error": "Email already registered."}), 400
    conn.close()
    return jsonify({"ok": True, "message": "Registered successfully."})

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"ok": False, "error": "Email and password required."}), 400

    conn = get_db()
    cur = conn.execute("SELECT id, password_hash, name FROM users WHERE email = ?", (email,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return jsonify({"ok": False, "error": "Invalid credentials."}), 400

    if not check_password_hash(row["password_hash"], password):
        return jsonify({"ok": False, "error": "Invalid credentials."}), 400

    # set session
    session["user_id"] = row["id"]
    session["user_email"] = email
    session["user_name"] = row["name"]
    return jsonify({"ok": True, "message": "Logged in.", "user": {"id": row["id"], "email": email, "name": row["name"]}})

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"ok": True})

@app.route("/api/me", methods=["GET"])
def me():
    uid = session.get("user_id")
    if not uid:
        return jsonify({"ok": False, "user": None})
    return jsonify({"ok": True, "user": {"id": uid, "email": session.get("user_email"), "name": session.get("user_name")}})

# --- PGs & Bookings ---
@app.route("/api/pgs", methods=["GET"])
def pgs():
    return jsonify({"ok": True, "pgs": SAMPLE_PGS})

@app.route("/api/book", methods=["POST"])
def book():
    uid = session.get("user_id")
    if not uid:
        return jsonify({"ok": False, "error": "Authentication required."}), 401

    data = request.get_json() or {}
    pg_id = int(data.get("pg_id") or 0)
    qty = int(data.get("qty") or 1)

    pg = next((p for p in SAMPLE_PGS if p["id"] == pg_id), None)
    if not pg:
        return jsonify({"ok": False, "error": "PG not found."}), 400

    amount = pg["price"] * qty
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO bookings (user_id, pg_id, qty, amount) VALUES (?, ?, ?, ?)", (uid, pg_id, qty, amount))
    conn.commit()
    booking_id = cur.lastrowid
    conn.close()
    return jsonify({"ok": True, "booking_id": booking_id, "amount": amount})

@app.route("/api/bookings", methods=["GET"])
def bookings():
    uid = session.get("user_id")
    if not uid:
        return jsonify({"ok": False, "error": "Authentication required."}), 401
    conn = get_db()
    cur = conn.execute("SELECT b.id, b.pg_id, b.qty, b.amount, b.created_at, p.name as pg_name FROM bookings b LEFT JOIN users u ON u.id = b.user_id LEFT JOIN (SELECT 1 as dummy) d ON 1=1 WHERE b.user_id = ? ORDER BY b.created_at DESC", (uid,))
    rows = cur.fetchall()
    conn.close()
    out = []
    for r in rows:
        out.append({
            "id": r["id"],
            "pg_id": r["pg_id"],
            "qty": r["qty"],
            "amount": r["amount"],
            "created_at": r["created_at"]
        })
    return jsonify({"ok": True, "bookings": out})

if __name__ == "__main__":
    init_db()
    app.run(debug=True, host="0.0.0.0", port=5000)
