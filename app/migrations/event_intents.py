"""Revision 3: atomic event creation receipts; no money data changes."""
def upgrade(conn):
    conn.exec_driver_sql('''CREATE TABLE event_creation_intents (
        user_id INTEGER NOT NULL REFERENCES users(id),
        operation VARCHAR(32) NOT NULL,
        request_id VARCHAR(36) NOT NULL,
        payload_hash VARCHAR(64) NOT NULL,
        response TEXT,
        PRIMARY KEY (user_id, operation, request_id)
    )''')
