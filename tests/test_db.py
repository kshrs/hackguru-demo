import unittest
from core.db import init_db, seed_db, get_db_connection


class TestDatabaseLayer(unittest.TestCase):
    def setUp(self):
        seed_db(force=True)

    def test_init_and_seed_db(self):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM events")
        count = cursor.fetchone()[0]
        self.assertGreaterEqual(count, 39, "Database should contain verified college events")

        cursor.execute("SELECT title, category, location, price FROM events WHERE title LIKE '%HackGURU%'")
        row = cursor.fetchone()
        self.assertIsNotNone(row)
        self.assertIn("Coimbatore", row["location"])
        conn.close()

    def test_event_embeddings_persisted(self):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM event_embeddings")
        count = cursor.fetchone()[0]
        self.assertGreaterEqual(count, 39, "All events should have float32 dense vector embeddings")
        conn.close()


if __name__ == "__main__":
    unittest.main()
