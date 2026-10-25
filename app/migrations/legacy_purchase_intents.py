"""Revision 4: receipts for retrying legacy purchases; no balance conversion."""
def upgrade(conn):
    conn.exec_driver_sql('''CREATE TABLE legacy_purchase_intents (
      user_id INTEGER NOT NULL REFERENCES users(id), request_id VARCHAR(64) NOT NULL,
      payload_hash VARCHAR(64) NOT NULL, response TEXT,
      PRIMARY KEY(user_id,request_id))''')
