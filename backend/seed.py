from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("UPDATE users SET role = 'team_leader' WHERE role = 'participant'"))
    conn.commit()
    print(f"Updated {result.rowcount} user(s): participant -> team_leader")

    conn.execute(text("""
        INSERT INTO events (slug, display_name, registration_fee, per_member_fee, max_members, gst_percentage, is_active, registration_open)
        VALUES
            ('go_kart',       'Go-Kart Racing',       0.0, 0.0, 5, 18.0, TRUE, TRUE),
            ('formula_green', 'Formula Green Racing',  0.0, 0.0, 5, 18.0, TRUE, TRUE)
        ON CONFLICT (slug) DO NOTHING
    """))
    conn.commit()

    rows = conn.execute(text("SELECT slug, display_name, max_members FROM events")).fetchall()
    for r in rows:
        print(f"Event: {r[0]} | {r[1]} | max_members={r[2]}")
