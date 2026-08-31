"""
Tests for core/db.py
Verifies schema initialization, seeding, query operations, and relations.
"""

import os
import unittest
import tempfile
import sqlite3
from core.db import init_db, seed_db, get_db_connection


class TestDatabaseLayer(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.db_path = os.path.join(self.temp_dir, "test_events.db")

    def tearDown(self):
        if os.path.exists(self.db_path):
            os.remove(self.db_path)
        if os.path.exists(self.temp_dir):
            os.rmdir(self.temp_dir)

    def test_init_and_seed_db(self):
        count = seed_db(self.db_path, force=True)
        self.assertGreaterEqual(count, 30)

        conn = get_db_connection(self.db_path)
        cursor = conn.cursor()

        # Check events
        cursor.execute("SELECT id, title, category, mode, location, price FROM events WHERE slug = 'hackguru-2026'")
        row = cursor.fetchone()
        self.assertIsNotNone(row)
        self.assertEqual(row["title"], "HackGURU 2026")
        self.assertEqual(row["category"], "Hackathon")
        self.assertEqual(row["mode"], "OFFLINE")
        self.assertEqual(row["location"], "Coimbatore")
        self.assertEqual(row["price"], "Free")

        # Check notifications
        cursor.execute("SELECT COUNT(*) FROM notifications")
        notif_count = cursor.fetchone()[0]
        self.assertGreaterEqual(notif_count, 2)

        # Check bookmarks
        cursor.execute("SELECT COUNT(*) FROM bookmarks WHERE user_id = 'usr_kishor'")
        bm_count = cursor.fetchone()[0]
        self.assertGreaterEqual(bm_count, 1)

        conn.close()


if __name__ == "__main__":
    unittest.main()
