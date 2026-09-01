"""
HackGuru - SQLite Database Layer and Seeder
Handles database initialization, connections, schema creation, querying,
and seed data generation from research assets.
"""

import os
import sys
import sqlite3
import json
import re
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

DB_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(DB_DIR, "hackguru.db")


def get_db_connection(db_path=None):
    """Returns a SQLite connection with row factory configured."""
    target_path = db_path or DB_PATH
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    conn = sqlite3.connect(target_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path=None):
    """Creates the tables if they do not exist."""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        subtitle TEXT,
        description TEXT,
        category TEXT NOT NULL,
        mode TEXT NOT NULL,
        location TEXT NOT NULL,
        venue TEXT,
        date TEXT NOT NULL,
        start_date TEXT,
        end_date TEXT,
        price TEXT NOT NULL,
        price_numeric REAL DEFAULT 0.0,
        views_count INTEGER DEFAULT 0,
        views_display TEXT DEFAULT '0',
        registrations_count INTEGER DEFAULT 0,
        image_url TEXT,
        organizer TEXT,
        college TEXT,
        tags TEXT,
        prize_pool TEXT,
        eligibility TEXT,
        is_featured INTEGER DEFAULT 0,
        is_trending INTEGER DEFAULT 0,
        is_virtual INTEGER DEFAULT 0,
        is_upcoming INTEGER DEFAULT 1,
        rating REAL DEFAULT 4.8,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        event_id INTEGER NOT NULL,
        type TEXT DEFAULT 'bookmark',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, event_id, type)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_email TEXT NOT NULL,
        event_id INTEGER NOT NULL,
        team_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, event_id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS search_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT NOT NULL,
        algorithm_mode TEXT NOT NULL,
        results_count INTEGER DEFAULT 0,
        latency_ms REAL DEFAULT 0.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        event_id INTEGER NOT NULL,
        interaction_type TEXT NOT NULL,
        weight REAL DEFAULT 1.0,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        icon TEXT DEFAULT 'bell',
        timestamp TEXT NOT NULL,
        is_read INTEGER DEFAULT 0
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS event_embeddings (
        event_id INTEGER PRIMARY KEY,
        embedding BLOB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
    );
    """)

    conn.commit()
    conn.close()


def seed_db(db_path=None, force=False):
    """Seeds the database with comprehensive event data."""
    init_db(db_path)
    conn = get_db_connection(db_path)
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM events")
    count = cursor.fetchone()[0]

    if count > 0 and not force:
        conn.close()
        return count

    if force:
        cursor.execute("DELETE FROM events")
        cursor.execute("DELETE FROM event_embeddings")
        cursor.execute("DELETE FROM notifications")
        cursor.execute("DELETE FROM bookmarks")
        cursor.execute("DELETE FROM registrations")
        cursor.execute("DELETE FROM sqlite_sequence WHERE name IN ('events', 'event_embeddings', 'notifications', 'bookmarks', 'registrations')")

    # Rich baseline dataset aligned with research data and college event verticals
    events_data = [
        {
            "title": "HackGURU 2026",
            "slug": "hackguru-2026",
            "subtitle": "Flagship 36-Hour National Level AI & Full-Stack Hackathon",
            "description": "HackGURU 2026 is India's premier national-level hackathon bringing together visionary developers, designers, and AI researchers. Build innovative real-world software, deploy autonomous agents, and compete for massive prizes and venture funding.",
            "category": "Hackathon",
            "mode": "OFFLINE",
            "location": "Coimbatore",
            "venue": "KCT Tech Park, Saravanampatti, Coimbatore",
            "date": "04 Aug 2026",
            "start_date": "2026-08-04",
            "end_date": "2026-08-05",
            "price": "Free",
            "price_numeric": 0.0,
            "views_count": 2600,
            "views_display": "2.6K",
            "registrations_count": 850,
            "image_url": "/static/images/dfa7a08a-4016-4409-aefa-a87b4000da9a-ECLearnix---Hero-Section-Banners.png",
            "organizer": "HackGURU Developer Guild & ECLearnix",
            "college": "Kumaraguru College of Technology, Coimbatore",
            "tags": json.dumps(["Hackathon", "AI/ML", "Agentic AI", "Full Stack", "Web3", "Cash Prize"]),
            "prize_pool": "₹2,50,000 + Cloud Credits",
            "eligibility": "Open to all engineering & computer science students",
            "is_featured": 1,
            "is_trending": 1,
            "is_virtual": 0,
            "is_upcoming": 1,
            "rating": 4.9
        },
        {
            "title": "COREXATHON 2026",
            "slug": "corexathon-2026",
            "subtitle": "24-Hour Hardware & Core Engineering Innovation Challenge",
            "description": "Think · Build · Innovate · Inspire. A 24-hour intensive engineering sprint focused on embedded systems, robotics, IoT edge computing, and smart manufacturing prototypes.",
            "category": "Hackathon",
            "mode": "OFFLINE",
            "location": "Coimbatore",
            "venue": "PSG Tech Core Innovation Hub, Peelamedu, Coimbatore",
            "date": "01 Sept 2026",
            "start_date": "2026-09-01",
            "end_date": "2026-09-02",
            "price": "₹550",
            "price_numeric": 550.0,
            "views_count": 244,
            "views_display": "244",
            "registrations_count": 120,
            "image_url": "/static/images/74f82205-f2d5-466c-a56d-b9f60ff309e4-Screenshot-2026-08-24-at-5.08.24-PM.webp",
            "organizer": "CoreX Innovation Society",
            "college": "PSG College of Technology, Coimbatore",
            "tags": json.dumps(["Hardware", "IoT", "Robotics", "Embedded", "Hackathon"]),
            "prize_pool": "₹1,00,000 Cash + Internships",
            "eligibility": "UG / PG Engineering Students",
            "is_featured": 1,
            "is_trending": 1,
            "is_virtual": 0,
            "is_upcoming": 1,
            "rating": 4.8
        },
        {
            "title": "HACK THE HORIZON 2.0 – 24-HOUR HACKATHON",
            "slug": "hack-the-horizon-2-0",
            "subtitle": "Cross-Platform Product Design & Rapid Prototyping",
            "description": "Push the limits of modern software engineering. Hack the Horizon 2.0 challenges teams to solve pressing fintech, edtech, and climate problems within 24 intense hours.",
            "category": "Hackathon",
            "mode": "OFFLINE",
            "location": "Coimbatore",
            "venue": "CIT Innovation Centre, Civil Aerodrome Post, Coimbatore",
            "date": "24 Sept 2026",
            "start_date": "2026-09-24",
            "end_date": "2026-09-25",
            "price": "₹700",
            "price_numeric": 700.0,
            "views_count": 233,
            "views_display": "233",
            "registrations_count": 94,
            "image_url": "/static/images/no-image-found.png",
            "organizer": "Horizon Coding Society",
            "college": "Coimbatore Institute of Technology",
            "tags": json.dumps(["Hackathon", "FinTech", "Cloud", "Mobile", "24-Hours"]),
            "prize_pool": "₹75,000 + Goodies",
            "eligibility": "Students from all recognized universities",
            "is_featured": 1,
            "is_trending": 1,
            "is_virtual": 0,
            "is_upcoming": 1,
            "rating": 4.7
        },
        {
            "title": "GENESIS'26 / Lost in Space",
            "slug": "genesis-26-lost-in-space",
            "subtitle": "National Aerospace & Space Tech Hack Challenge",
            "description": "Navigate uncharted cosmic territories. Build orbital mechanics simulations, satellite telemetry decoders, and autonomous rover navigation algorithms.",
            "category": "Contest",
            "mode": "OFFLINE",
            "location": "Chennai",
            "venue": "SRM Tech Park, Kattankulathur, Chennai",
            "date": "02 Sept 2026",
            "start_date": "2026-09-02",
            "end_date": "2026-09-03",
            "price": "₹225",
            "price_numeric": 225.0,
            "views_count": 61,
            "views_display": "61",
            "registrations_count": 45,
            "image_url": "/static/images/ba3ede2d-0c8a-48df-94f6-d2cc5e9408c4-4-2026082607.webp",
            "organizer": "Genesis Space Club",
            "college": "SRM Institute of Science and Technology, Chennai",
            "tags": json.dumps(["SpaceTech", "Aerospace", "Contest", "Simulation", "AI"]),
            "prize_pool": "₹50,000",
            "eligibility": "All College Students",
            "is_featured": 1,
            "is_trending": 0,
            "is_virtual": 0,
            "is_upcoming": 1,
            "rating": 4.8
        },
        {
            "title": "GENESIS'26 / Silent Stroke",
            "slug": "genesis-26-silent-stroke",
            "subtitle": "Speed UI/UX Design & Creative Frontend Battle",
            "description": "A rapid-fire design and frontend showdown where participants translate abstract themes into intuitive, accessible UI/UX prototypes and code.",
            "category": "Contest",
            "mode": "OFFLINE",
            "location": "Chennai",
            "venue": "SRM Campus Main Auditorium, Chennai",
            "date": "02 Sept 2026",
            "start_date": "2026-09-02",
            "end_date": "2026-09-02",
            "price": "Free",
            "price_numeric": 0.0,
            "views_count": 37,
            "views_display": "37",
            "registrations_count": 30,
            "image_url": "/static/images/27f3473b-4beb-4e2f-b623-23a0aed821c8-Silent-Stroke-2026082606.webp",
            "organizer": "Designers Guild Chennai",
            "college": "SRM Institute of Science and Technology, Chennai",
            "tags": json.dumps(["UI/UX", "Design", "Frontend", "Figma", "Web Design"]),
            "prize_pool": "₹30,000 + Figma Subscriptions",
            "eligibility": "Open to all students",
            "is_featured": 1,
            "is_trending": 0,
            "is_virtual": 0,
            "is_upcoming": 1,
            "rating": 4.6
        },
        {
            "title": "GENESIS'26 / Cosmic Quest",
            "slug": "genesis-26-cosmic-quest",
            "subtitle": "Algorithmic Problem Solving & Competitive Programming",
            "description": "Test your algorithmic problem-solving speed, dynamic programming mastery, and graph theory intuitions across rigorous CP problem sets.",
            "category": "Contest",
            "mode": "OFFLINE",
            "location": "Chennai",
            "venue": "Lab Block 4, SRM University, Chennai",
            "date": "02 Sept 2026",
            "start_date": "2026-09-02",
            "end_date": "2026-09-02",
            "price": "₹85",
            "price_numeric": 85.0,
            "views_count": 23,
            "views_display": "23",
            "registrations_count": 20,
            "image_url": "/static/images/fbe5220e-b58c-4163-a995-fed9236ae8a2-3-2026082524.webp",
            "organizer": "Genesis CP Chapter",
            "college": "SRM University, Chennai",
            "tags": json.dumps(["Competitive Programming", "DSA", "Algorithms", "C++", "Python"]),
            "prize_pool": "₹25,000",
            "eligibility": "College Coders",
            "is_featured": 1,
            "is_trending": 0,
            "is_virtual": 0,
            "is_upcoming": 1,
            "rating": 4.7
        },
        {
            "title": "GENESIS'26 / Martian Chronicles",
            "slug": "genesis-26-martian-chronicles",
            "subtitle": "Autonomous Robotics & Rover Obstacle Challenge",
            "description": "Design and program autonomous terrestrial rovers to traverse simulated Martian terrains, avoid hazards, and collect rock samples.",
            "category": "Contest",
            "mode": "OFFLINE",
            "location": "Chennai",
            "venue": "Outdoor Robotics Arena, SRM University, Chennai",
            "date": "02 Sept 2026",
            "start_date": "2026-09-02",
            "end_date": "2026-09-02",
            "price": "₹90",
            "price_numeric": 90.0,
            "views_count": 24,
            "views_display": "24",
            "registrations_count": 18,
            "image_url": "/static/images/c3b795da-0337-42b9-98a1-8d7136d8e821-2-2026082523.webp",
            "organizer": "Robotics Club",
            "college": "SRM University, Chennai",
            "tags": json.dumps(["Robotics", "ROS", "Hardware", "Arduino", "Autonomous"]),
            "prize_pool": "₹35,000",
            "eligibility": "Engineering & Diploma Students",
            "is_featured": 1,
            "is_trending": 0,
            "is_virtual": 0,
            "is_upcoming": 1,
            "rating": 4.9
        },
        {
            "title": "Workshop on Advanced Waste Valorization Technologies",
            "slug": "workshop-waste-valorization-technologies-2026",
            "subtitle": "Expert Talks, Practical Insights and Sustainable Applications",
            "description": "Gain hands-on knowledge on circular economy, bio-refinery engineering, and advanced industrial waste valorization processes led by senior researchers.",
            "category": "Workshop",
            "mode": "OFFLINE",
            "location": "Chennai",
            "venue": "Biotech Seminar Hall, Anna University, Chennai",
            "date": "03 Sept 2026",
            "start_date": "2026-09-03",
            "end_date": "2026-09-04",
            "price": "₹300",
            "price_numeric": 300.0,
            "views_count": 23,
            "views_display": "23",
            "registrations_count": 40,
            "image_url": "/static/images/4b47bdc4-acd9-4462-9c0c-e3544868c38b-Workshop-D3-2026082508.webp",
            "organizer": "Sustainable Engineering Council",
            "college": "Anna University, Chennai",
            "tags": json.dumps(["Workshop", "Sustainability", "Biotech", "Green Tech", "Research"]),
            "prize_pool": "Certificates of Excellence",
            "eligibility": "B.Tech / M.Tech / PhD Scholars",
            "is_featured": 1,
            "is_trending": 0,
            "is_virtual": 0,
            "is_upcoming": 1,
            "rating": 4.7
        },
        {
            "title": "Expert-Led Workshop on Resource Recovery & Green Tech 2026",
            "slug": "workshop-resource-recovery-greentech-2026",
            "subtitle": "Sustainable Chemistry & Industrial Lifecycle Engineering",
            "description": "A specialized workshop covering carbon capture, catalytic recycling, and environmental regulatory compliance for forward-looking engineers.",
            "category": "Workshop",
            "mode": "OFFLINE",
            "location": "Chennai",
            "venue": "Auditorium B, IIT Madras Research Park, Chennai",
            "date": "02 Sept 2026",
            "start_date": "2026-09-02",
            "end_date": "2026-09-02",
            "price": "₹300",
            "price_numeric": 300.0,
            "views_count": 21,
            "views_display": "21",
            "registrations_count": 35,
            "image_url": "/static/images/70b46b41-4fb2-4dbb-9b58-657f7a465809-Expert--Led-Wrokshop---Day-1-2026082506.webp",
            "organizer": "Centre for Environmental Studies",
            "college": "IIT Madras Research Park, Chennai",
            "tags": json.dumps(["GreenTech", "Workshop", "Research", "Environment"]),
            "prize_pool": "Participation Certificates",
            "eligibility": "All students & faculty",
            "is_featured": 1,
            "is_trending": 0,
            "is_virtual": 0,
            "is_upcoming": 1,
            "rating": 4.8
        },
        {
            "title": "International Conference on AI-Driven Innovation - ICAiECSM",
            "slug": "international-conference-ai-driven-innovation-2026",
            "subtitle": "Engineering, Commerce, Science, and Management Symposia",
            "description": "ICAiECSM 2026 brings world-renowned keynote speakers, researchers, and AI pioneers together to present peer-reviewed papers on Generative AI, Machine Learning, and Enterprise Automation.",
            "category": "Conference",
            "mode": "ONLINE",
            "location": "Online",
            "venue": "Virtual Interactive Stage (Zoom / WebEx)",
            "date": "26 Sept 2026",
            "start_date": "2026-09-26",
            "end_date": "2026-09-27",
            "price": "₹200",
            "price_numeric": 200.0,
            "views_count": 165,
            "views_display": "165",
            "registrations_count": 210,
            "image_url": "/static/images/d24159ee-2868-45c0-b9b1-a4efd49c5730-Hero-Section-Banners.webp",
            "organizer": "Global AI & Management Research Forum",
            "college": "Amity University & Virtual Hub",
            "tags": json.dumps(["AI/ML", "Conference", "Research Paper", "Online", "Scopus"]),
            "prize_pool": "Best Paper Award ₹30,000",
            "eligibility": "Researchers, Faculty & Students",
            "is_featured": 1,
            "is_trending": 1,
            "is_virtual": 1,
            "is_upcoming": 1,
            "rating": 4.9
        },
        {
            "title": "Smart India Innovation Hackathon 2026",
            "slug": "smart-india-innovation-hackathon-2026",
            "subtitle": "Nationwide Student Hackathon on Civic & Smart City Challenges",
            "description": "Collaborate in teams to engineer digital and hardware solutions for governance, healthcare, traffic management, and smart rural infrastructure across India.",
            "category": "Hackathon",
            "mode": "OFFLINE",
            "location": "Bengaluru",
            "venue": "IISc Bangalore Convention Centre, Bengaluru",
            "date": "18 Sept 2026",
            "start_date": "2026-09-18",
            "end_date": "2026-09-19",
            "price": "Free",
            "price_numeric": 0.0,
            "views_count": 1890,
            "views_display": "1.8K",
            "registrations_count": 620,
            "image_url": "/static/images/4cdc9205-648a-4b29-98df-015da1279671-Screenshot-2026-08-24-at-11.12.43-AM.webp",
            "organizer": "National Innovation Council",
            "college": "Indian Institute of Science (IISc), Bengaluru",
            "tags": json.dumps(["Hackathon", "Smart City", "AI", "GovTech", "Open Innovation"]),
            "prize_pool": "₹5,00,000 Total Prizes",
            "eligibility": "College students across India",
            "is_featured": 0,
            "is_trending": 1,
            "is_virtual": 0,
            "is_upcoming": 1,
            "rating": 4.9
        },
        {
            "title": "Hackspora'25",
            "slug": "hackspora-2026",
            "subtitle": "National Level Web3 & Decentralized App Sprint",
            "description": "Build decentralized applications, smart contract protocols, and zero-knowledge privacy layers with mentorship from leading blockchain developers.",
            "category": "Hackathon",
            "mode": "OFFLINE",
            "location": "Bengaluru",
            "venue": "PES University Electronic City Campus, Bengaluru",
            "date": "12 Sept 2026",
            "start_date": "2026-09-12",
            "end_date": "2026-09-13",
            "price": "₹150",
            "price_numeric": 150.0,
            "views_count": 950,
            "views_display": "950",
            "registrations_count": 310,
            "image_url": "/static/images/a5ff5273-232a-4711-ae74-3548b54ee7e8-Screenshot-2026-08-27-at-11.03.41-AM.webp",
            "organizer": "Hackspora Web3 Community",
            "college": "PES University, Bengaluru",
            "tags": json.dumps(["Web3", "Blockchain", "Solidity", "Hackathon", "Ethereum"]),
            "prize_pool": "$5,000 Grant Pool",
            "eligibility": "Developers, Designers & Cryptography Enthusiasts",
            "is_featured": 0,
            "is_trending": 1,
            "is_virtual": 0,
            "is_upcoming": 1,
            "rating": 4.8
        },
        {
            "title": "Great Indian Hackathon 2026",
            "slug": "great-indian-hackathon-2026",
            "subtitle": "36-Hour National Sprint on Next-Gen Consumer Tech",
            "description": "Build high-impact consumer apps, high-throughput backend systems, and AI copilot agents. Mentorship from top startup founders and unicorn leaders.",
            "category": "Hackathon",
            "mode": "OFFLINE",
            "location": "Hyderabad",
            "venue": "T-Hub Phase 2, Madhapur, Hyderabad",
            "date": "15 Oct 2026",
            "start_date": "2026-10-15",
            "end_date": "2026-10-17",
            "price": "Free",
            "price_numeric": 0.0,
            "views_count": 1420,
            "views_display": "1.4K",
            "registrations_count": 510,
            "image_url": "/static/images/4a77da91-ec27-4e6d-9587-3c6ccb35db0b-Screenshot-2026-05-05-at-5.10.46-PM.png",
            "organizer": "T-Hub & Founders Hub",
            "college": "IIIT Hyderabad Hub, Hyderabad",
            "tags": json.dumps(["Hackathon", "Startups", "AI", "Consumer Tech", "Cloud"]),
            "prize_pool": "₹3,00,000 + Incubation",
            "eligibility": "Open to all students & recent graduates",
            "is_featured": 0,
            "is_trending": 1,
            "is_virtual": 0,
            "is_upcoming": 1,
            "rating": 4.9
        },
        {
            "title": "EU Agri-Hackathon 2026 – Simplifying for Farmers",
            "slug": "eu-agri-hackathon-2026",
            "subtitle": "International Sustainable Precision Agriculture Hackathon",
            "description": "Leverage computer vision, drone imagery, weather prediction models, and low-cost IoT soil sensors to empower farmers worldwide.",
            "category": "Hackathon",
            "mode": "ONLINE",
            "location": "Online",
            "venue": "Global Discord & Devpost Platform",
            "date": "08 Oct 2026",
            "start_date": "2026-10-08",
            "end_date": "2026-10-10",
            "price": "Free",
            "price_numeric": 0.0,
            "views_count": 810,
            "views_display": "810",
            "registrations_count": 340,
            "image_url": "/static/images/4c1bb28a-2507-4fac-bd26-96d48eb90433-Screenshot-2026-05-06-at-11.03.56-AM.png",
            "organizer": "European AgriTech Network & Global Partners",
            "college": "Online Global Track",
            "tags": json.dumps(["AgriTech", "AI/ML", "IoT", "Hackathon", "Sustainability"]),
            "prize_pool": "€10,000 Global Fund",
            "eligibility": "Global Student Teams",
            "is_featured": 0,
            "is_trending": 1,
            "is_virtual": 1,
            "is_upcoming": 1,
            "rating": 4.7
        },
        {
            "title": "Smart Ration Dispenser 2026",
            "slug": "smart-ration-dispenser-2026",
            "subtitle": "Civic Hardware & Automated IoT Dispenser Competition",
            "description": "Design an automated, tamper-proof, biometric-authenticated ration distribution machine capable of dispensing grains with sub-gram accuracy.",
            "category": "Contest",
            "mode": "OFFLINE",
            "location": "Delhi",
            "venue": "IIT Delhi MakerSpace, Hauz Khas, New Delhi",
            "date": "22 Sept 2026",
            "start_date": "2026-09-22",
            "end_date": "2026-09-22",
            "price": "Free",
            "price_numeric": 0.0,
            "views_count": 420,
            "views_display": "420",
            "registrations_count": 80,
            "image_url": "/static/images/4a6cbb24-257c-4d2b-b6e6-c7890ce3bf7b-image-(5).png",
            "organizer": "Social Tech Innovators Delhi",
            "college": "IIT Delhi, New Delhi",
            "tags": json.dumps(["Hardware", "IoT", "Embedded", "Social Impact"]),
            "prize_pool": "₹75,000",
            "eligibility": "Engineering & Polytechnic Students",
            "is_featured": 0,
            "is_trending": 1,
            "is_virtual": 0,
            "is_upcoming": 1,
            "rating": 4.8
        },
        {
            "title": "Hack Beyond Limits: Online Odyssey",
            "slug": "hack-beyond-limits-online-odyssey",
            "subtitle": "48-Hour Global Distributed Hackathon",
            "description": "Compete against thousands of student developers from across the globe in tracks including Generative AI, Cloud Infrastructure, Security, and Open Source Tooling.",
            "category": "Hackathon",
            "mode": "ONLINE",
            "location": "Online",
            "venue": "Hackathon Metaverse & Discord Hub",
            "date": "10 Oct 2026",
            "start_date": "2026-10-10",
            "end_date": "2026-10-12",
            "price": "Free",
            "price_numeric": 0.0,
            "views_count": 1300,
            "views_display": "1.3K",
            "registrations_count": 490,
            "image_url": "/static/images/55117816-53e3-4811-b54b-35d99b3d3446-ChatGPT-Image-May-22,-2026,-12_44_06-PM.png",
            "organizer": "Global Dev Collective",
            "college": "Online Hub",
            "tags": json.dumps(["Hackathon", "Online", "AI/ML", "Cloud", "Open Source"]),
            "prize_pool": "$15,000 Prize Pool",
            "eligibility": "All Students Worldwide",
            "is_featured": 0,
            "is_trending": 1,
            "is_virtual": 1,
            "is_upcoming": 1,
            "rating": 4.9
        },
        {
            "title": "Neuro Knot 2.0 Hackathon 2026",
            "slug": "neuro-knot-2-0-hackathon-2026",
            "subtitle": "Brain-Computer Interface & Neural Computing Sprint",
            "description": "Explore EEG signal processing, neural prosthetics telemetry, and affective computing using Python, PyTorch, and open BCI datasets.",
            "category": "Hackathon",
            "mode": "OFFLINE",
            "location": "Mumbai",
            "venue": "IIT Bombay Victor Menezes Convention Centre, Mumbai",
            "date": "05 Oct 2026",
            "start_date": "2026-10-05",
            "end_date": "2026-10-06",
            "price": "₹400",
            "price_numeric": 400.0,
            "views_count": 560,
            "views_display": "560",
            "registrations_count": 175,
            "image_url": "/static/images/6a3c09c1-98dc-4543-8895-2dbe08487459-ChatGPT-Image-May-22,-2026,-12_44_06-PM.png",
            "organizer": "NeuroTech Society",
            "college": "IIT Bombay, Mumbai",
            "tags": json.dumps(["NeuroTech", "BCI", "AI/ML", "Healthcare", "Bioengineering"]),
            "prize_pool": "₹1,20,000",
            "eligibility": "UG / PG / PhD Researchers",
            "is_featured": 0,
            "is_trending": 1,
            "is_virtual": 0,
            "is_upcoming": 1,
            "rating": 4.8
        },
        {
            "title": "Advancement in Antenna Design & RIS Metasurfaces for Defence",
            "slug": "advancement-in-antenna-design-and-optimization-2026",
            "subtitle": "Virtual International Defense & Stealth RF Symposium",
            "description": "Explore reconfigurable intelligent surfaces (RIS), RF beamforming, and stealth radar cross-section optimization with microwave engineering authorities.",
            "category": "Conference",
            "mode": "ONLINE",
            "location": "Online",
            "venue": "Virtual Research Amphitheatre",
            "date": "14 Sept 2026",
            "start_date": "2026-09-14",
            "end_date": "2026-09-15",
            "price": "₹500",
            "price_numeric": 500.0,
            "views_count": 310,
            "views_display": "310",
            "registrations_count": 110,
            "image_url": "/static/images/6e15fee3-926b-4132-b2cb-0dc21ec3cfb8-ChatGPT-Image-May-22,-2026,-12_44_06-PM.png",
            "organizer": "Defence RF & Antenna Society",
            "college": "DRDO Sponsored / Online",
            "tags": json.dumps(["RF", "Defence", "Antenna", "Conference", "Online"]),
            "prize_pool": "IEEE Publication Opportunity",
            "eligibility": "Electronics & Telecom Engineers",
            "is_featured": 0,
            "is_trending": 0,
            "is_virtual": 1,
            "is_upcoming": 1,
            "rating": 4.7
        },
        {
            "title": "5-Day Online STTP on Autonomous Agentic AI Systems",
            "slug": "5-day-online-sttp-building-autonomous-agentic-ai",
            "subtitle": "Hands-On Short-Term Training Programme for Research & Innovation",
            "description": "Deep dive into multi-agent orchestration, tool-calling LLMs, LangGraph, AutoGen, and semantic memory architectures for scalable AI applications.",
            "category": "Workshop",
            "mode": "ONLINE",
            "location": "Online",
            "venue": "Google Meet & Hands-on Jupyter Cloud Labs",
            "date": "19 Sept 2026",
            "start_date": "2026-09-19",
            "end_date": "2026-09-23",
            "price": "₹600",
            "price_numeric": 600.0,
            "views_count": 890,
            "views_display": "890",
            "registrations_count": 280,
            "image_url": "/static/images/11c91dd8-d366-4746-a291-72a148fd2487-ChatGPT-Image-May-22,-2026,-12_44_06-PM.png",
            "organizer": "Center for Agentic AI & Deep Learning",
            "college": "NIT Trichy & Online Lab",
            "tags": json.dumps(["Agentic AI", "LLM", "Workshop", "Online", "Python", "LangChain"]),
            "prize_pool": "Certified AI Specialist Badge",
            "eligibility": "Engineers, Data Scientists & Students",
            "is_featured": 0,
            "is_trending": 0,
            "is_virtual": 1,
            "is_upcoming": 1,
            "rating": 4.9
        },
        {
            "title": "International Conference on AI in Construction & Built Environment",
            "slug": "international-conference-ai-in-construction-2026",
            "subtitle": "Sustainable Architecture, BIM, and Autonomous Robotics in Civil Engineering",
            "description": "Discover smart city structural health monitoring, AI-assisted BIM scheduling, and 3D concrete printing technologies.",
            "category": "Conference",
            "mode": "ONLINE",
            "location": "Online",
            "venue": "Virtual Auditorium",
            "date": "21 Sept 2026",
            "start_date": "2026-09-21",
            "end_date": "2026-09-22",
            "price": "₹350",
            "price_numeric": 350.0,
            "views_count": 270,
            "views_display": "270",
            "registrations_count": 95,
            "image_url": "/static/images/729af4f8-73b8-4eba-9631-b030d1c50106-ICAIC-2026-BROCHURE-.jpg",
            "organizer": "Built Environment AI Forum",
            "college": "BMS College of Engineering & Virtual Hall",
            "tags": json.dumps(["Civil", "Construction", "AI", "Conference", "Smart City"]),
            "prize_pool": "Springer Publication",
            "eligibility": "Civil, Arch & AI Researchers",
            "is_featured": 0,
            "is_trending": 0,
            "is_virtual": 1,
            "is_upcoming": 1,
            "rating": 4.6
        },
        {
            "title": "Hands-On AI Tools for Academic Writing & Research Publishing",
            "slug": "hands-on-ai-tools-for-academic-writing-2026",
            "subtitle": "Elevate Your Research Velocity, Literature Review, and Journal Impact",
            "description": "Learn ethical AI usage for citation graph analysis, literature synthesis, LaTeX automation, and high-impact manuscript preparation.",
            "category": "Workshop",
            "mode": "ONLINE",
            "location": "Online",
            "venue": "Interactive Zoom Workshop",
            "date": "28 Sept 2026",
            "start_date": "2026-09-28",
            "end_date": "2026-09-28",
            "price": "₹199",
            "price_numeric": 199.0,
            "views_count": 450,
            "views_display": "450",
            "registrations_count": 190,
            "image_url": "/static/images/cbc1957d-442d-4551-b70f-ecf8c1a83582-ChatGPT-Image-May-22,-2026,-12_44_06-PM.png",
            "organizer": "Academic Excellence Guild",
            "college": "National Scholars Academy",
            "tags": json.dumps(["Research", "Academic Writing", "AI Tools", "Workshop", "Online"]),
            "prize_pool": "Course Toolkit & Verified Certificate",
            "eligibility": "Scholars, Students & Faculty",
            "is_featured": 0,
            "is_trending": 0,
            "is_virtual": 1,
            "is_upcoming": 1,
            "rating": 4.8
        },
        {
            "title": "Monomousumi Monthly International Essay & Writing Contest",
            "slug": "monomousumi-monthly-international-essay-contest-2026",
            "subtitle": "Global Creative Writing, Tech Commentary, and Thought Leadership",
            "description": "A prestigious recurring essay competition encouraging youth to write on emerging technologies, ethics in AI, and global societal changes.",
            "category": "Contest",
            "mode": "ONLINE",
            "location": "Online",
            "venue": "Online Portal Submission",
            "date": "30 Sept 2026",
            "start_date": "2026-09-30",
            "end_date": "2026-09-30",
            "price": "Free",
            "price_numeric": 0.0,
            "views_count": 780,
            "views_display": "780",
            "registrations_count": 320,
            "image_url": "/static/images/021e0a24-bd49-432b-8369-363c3d7224dd-ChatGPT-Image-Jul-30,-2026,-04_56_52-PM.png",
            "organizer": "Monomousumi Foundation",
            "college": "International Writers Collective",
            "tags": json.dumps(["Writing", "Contest", "Creative", "Online", "Cash Prize"]),
            "prize_pool": "₹20,000 + Global Publication",
            "eligibility": "Students below 25 years",
            "is_featured": 0,
            "is_trending": 0,
            "is_virtual": 1,
            "is_upcoming": 1,
            "rating": 4.7
        },
        {
            "title": "Graphic Designer & Branding Intern Challenge",
            "slug": "graphic-designer-branding-internship-2026",
            "subtitle": "Paid Internship & Live Portfolio Review at ECLearnix",
            "description": "Showcase your brand identity, Figma prototyping, and design system creation skills for a 6-month paid internship opportunity.",
            "category": "Internship",
            "mode": "ONLINE",
            "location": "Online",
            "venue": "Remote / Hybrid",
            "date": "15 Oct 2026",
            "start_date": "2026-10-15",
            "end_date": "2026-10-15",
            "price": "Free",
            "price_numeric": 0.0,
            "views_count": 630,
            "views_display": "630",
            "registrations_count": 210,
            "image_url": "/static/images/43543827-b741-4e33-af86-3ef5f2571cd7-ChatGPT-Image-Jul-30,-2026,-04_51_56-PM.png",
            "organizer": "ECLearnix Design Studio",
            "college": "Remote India",
            "tags": json.dumps(["Internship", "UI/UX", "Graphic Design", "Remote", "Paid"]),
            "prize_pool": "₹25,000/mo Stipend",
            "eligibility": "Design Students & Enthusiasts",
            "is_featured": 0,
            "is_trending": 0,
            "is_virtual": 1,
            "is_upcoming": 1,
            "rating": 4.8
        },
        {
            "title": "Software Testing & QA Automation Intern Drive",
            "slug": "software-testing-internship-2026",
            "subtitle": "Cypress, Playwright, and PyTest Automation Internship",
            "description": "Solve automated end-to-end testing challenges, build CI/CD test pipelines, and qualify for immediate full-time hire.",
            "category": "Internship",
            "mode": "ONLINE",
            "location": "Online",
            "venue": "Remote / Bengaluru Office",
            "date": "20 Oct 2026",
            "start_date": "2026-10-20",
            "end_date": "2026-10-20",
            "price": "Free",
            "price_numeric": 0.0,
            "views_count": 480,
            "views_display": "480",
            "registrations_count": 180,
            "image_url": "/static/images/7efb3fd7-faf3-49d9-9e54-a3da061db5d1-ChatGPT-Image-Jul-30,-2026,-04_49_01-PM.png",
            "organizer": "QA Global Labs",
            "college": "Bengaluru Tech Hub",
            "tags": json.dumps(["Internship", "QA", "Testing", "Python", "Automation"]),
            "prize_pool": "₹30,000/mo Stipend",
            "eligibility": "CS / IT Pre-final & Final Year Students",
            "is_featured": 0,
            "is_trending": 0,
            "is_virtual": 1,
            "is_upcoming": 1,
            "rating": 4.7
        },
        {
            "title": "Video Editing & Motion Graphics Intern",
            "slug": "video-editing-motion-graphics-intern-2026",
            "subtitle": "After Effects & Premiere Pro Production Internship",
            "description": "Create engaging social media narratives, product explainers, and 3D motion graphics for high-growth tech ventures.",
            "category": "Internship",
            "mode": "ONLINE",
            "location": "Online",
            "venue": "Remote Studio",
            "date": "18 Oct 2026",
            "start_date": "2026-10-18",
            "end_date": "2026-10-18",
            "price": "Free",
            "price_numeric": 0.0,
            "views_count": 390,
            "views_display": "390",
            "registrations_count": 140,
            "image_url": "/static/images/320b309b-21f2-4a3b-b429-59f196103d17-ChatGPT-Image-Jul-30,-2026,-04_46_42-PM.png",
            "organizer": "MediaForge Studios",
            "college": "Remote India",
            "tags": json.dumps(["Video Editing", "Motion Graphics", "Internship", "Remote"]),
            "prize_pool": "₹20,000/mo Stipend",
            "eligibility": "Creative Media Students",
            "is_featured": 0,
            "is_trending": 0,
            "is_virtual": 1,
            "is_upcoming": 1,
            "rating": 4.6
        },
        {
            "title": "UI/UX Product Designer Intern Challenge",
            "slug": "ui-ux-designer-intern-2026",
            "subtitle": "Product Thinking, Wireframing, and Micro-Interactions",
            "description": "Design an intuitive mobile-first experience for a complex B2B workflow and secure a 6-month product design fellowship.",
            "category": "Internship",
            "mode": "ONLINE",
            "location": "Online",
            "venue": "Remote",
            "date": "25 Oct 2026",
            "start_date": "2026-10-25",
            "end_date": "2026-10-25",
            "price": "Free",
            "price_numeric": 0.0,
            "views_count": 720,
            "views_display": "720",
            "registrations_count": 260,
            "image_url": "/static/images/81795700-af03-4b3b-9e9a-687c790765bc-ChatGPT-Image-Jul-30,-2026,-04_43_34-PM.png",
            "organizer": "Nexus Design Labs",
            "college": "Remote India",
            "tags": json.dumps(["UI/UX", "Product Design", "Figma", "Internship"]),
            "prize_pool": "₹35,000/mo Stipend",
            "eligibility": "Passionate Product Designers",
            "is_featured": 0,
            "is_trending": 0,
            "is_virtual": 1,
            "is_upcoming": 1,
            "rating": 4.9
        },
        {
            "title": "Business Analyst & Product Strategy Intern",
            "slug": "business-analyst-intern-2026",
            "subtitle": "Market Research, SQL Dashboards, and Financial Modeling",
            "description": "Conduct deep market sizing, build interactive analytics dashboards, and present data-backed product roadmaps to senior executives.",
            "category": "Internship",
            "mode": "ONLINE",
            "location": "Online",
            "venue": "Remote / Mumbai Office",
            "date": "22 Oct 2026",
            "start_date": "2026-10-22",
            "end_date": "2026-10-22",
            "price": "Free",
            "price_numeric": 0.0,
            "views_count": 510,
            "views_display": "510",
            "registrations_count": 190,
            "image_url": "/static/images/595fadbb-808b-475d-8005-44f9b58b9583-ChatGPT-Image-Jul-30,-2026,-04_40_15-PM.png",
            "organizer": "VentureGrowth Analytics",
            "college": "Mumbai / Remote",
            "tags": json.dumps(["Business Analyst", "SQL", "Product Strategy", "Internship"]),
            "prize_pool": "₹30,000/mo Stipend",
            "eligibility": "BBA / MBA / Engineering Students",
            "is_featured": 0,
            "is_trending": 0,
            "is_virtual": 1,
            "is_upcoming": 1,
            "rating": 4.7
        },
        {
            "title": "Fullstack Developer Intern Drive 2026",
            "slug": "fullstack-developer-intern-2026",
            "subtitle": "Python, React, TypeScript, and Scalable Backend APIs",
            "description": "Build production-grade REST APIs, optimized database queries, and reactive component interfaces for high-concurrency systems.",
            "category": "Internship",
            "mode": "ONLINE",
            "location": "Online",
            "venue": "Remote / Hyderabad Tech Hub",
            "date": "28 Oct 2026",
            "start_date": "2026-10-28",
            "end_date": "2026-10-28",
            "price": "Free",
            "price_numeric": 0.0,
            "views_count": 1150,
            "views_display": "1.1K",
            "registrations_count": 420,
            "image_url": "/static/images/4586076f-0380-425c-95de-6a42729abb3a-ChatGPT-Image-May-22,-2026,-12_44_06-PM.png",
            "organizer": "CloudScale Systems",
            "college": "Hyderabad Tech Hub",
            "tags": json.dumps(["Fullstack", "Python", "React", "TypeScript", "Internship"]),
            "prize_pool": "₹40,000/mo Stipend",
            "eligibility": "Computer Science & Engineering Students",
            "is_featured": 0,
            "is_trending": 0,
            "is_virtual": 1,
            "is_upcoming": 1,
            "rating": 4.9
        },
        {
            "title": "National Fintech Olympiad 2026",
            "slug": "national-fintech-olympiad-2026",
            "subtitle": "Algorithmic Trading, Risk Analysis, and Financial Computing",
            "description": "Compete in live algorithmic trading simulations, portfolio optimization models, and regulatory compliance algorithms.",
            "category": "Contest",
            "mode": "ONLINE",
            "location": "Online",
            "venue": "Quant Trading Sandbox",
            "date": "14 Nov 2026",
            "start_date": "2026-11-14",
            "end_date": "2026-11-15",
            "price": "Free",
            "price_numeric": 0.0,
            "views_count": 870,
            "views_display": "870",
            "registrations_count": 310,
            "image_url": "/static/images/dfa7a08a-4016-4409-aefa-a87b4000da9a-ECLearnix---Hero-Section-Banners.png",
            "organizer": "National Institute of Securities & Finance",
            "college": "Online Track",
            "tags": json.dumps(["FinTech", "Trading", "Contest", "Finance", "Python"]),
            "prize_pool": "₹1,50,000 Cash Prizes",
            "eligibility": "All College Students",
            "is_featured": 0,
            "is_trending": 0,
            "is_virtual": 1,
            "is_upcoming": 1,
            "rating": 4.8
        },
        {
            "title": "CavinKare - MMA Chinnikrishnan Innovation Awards 2026",
            "slug": "cavinkare-chinnikrishnan-innovation-awards-2026",
            "subtitle": "Grassroots Innovations & Social Entrepreneurship Awards",
            "description": "Showcase disruptive grassroots innovations in manufacturing, packaging, healthcare, and renewable energy with substantial grant funding.",
            "category": "Contest",
            "mode": "OFFLINE",
            "location": "Chennai",
            "venue": "Madras Management Association Hall, Chennai",
            "date": "10 Nov 2026",
            "start_date": "2026-11-10",
            "end_date": "2026-11-10",
            "price": "Free",
            "price_numeric": 0.0,
            "views_count": 640,
            "views_display": "640",
            "registrations_count": 150,
            "image_url": "/static/images/74f82205-f2d5-466c-a56d-b9f60ff309e4-Screenshot-2026-08-24-at-5.08.24-PM.webp",
            "organizer": "CavinKare & Madras Management Association",
            "college": "MMA Chennai",
            "tags": json.dumps(["Innovation", "Entrepreneurship", "Social Impact", "Awards"]),
            "prize_pool": "₹10,00,000 Grant Fund",
            "eligibility": "Innovators, Startups & Student Teams",
            "is_featured": 0,
            "is_trending": 0,
            "is_virtual": 0,
            "is_upcoming": 1,
            "rating": 4.9
        },
        {
            "title": "NCL Inter-College Cricket Trials & Championship 2026",
            "slug": "ncl-cricket-trials-championship-2026",
            "subtitle": "National T20 College Cricket Scouting & Tournament",
            "description": "Participate in state-level selection trials for the National College Cricket League championship with scouts and certified coaches.",
            "category": "Sports",
            "mode": "OFFLINE",
            "location": "Bengaluru",
            "venue": "Chinnaswamy College Grounds, Bengaluru",
            "date": "05 Nov 2026",
            "start_date": "2026-11-05",
            "end_date": "2026-11-08",
            "price": "₹200",
            "price_numeric": 200.0,
            "views_count": 920,
            "views_display": "920",
            "registrations_count": 340,
            "image_url": "/static/images/college-sports-ground.jpeg",
            "organizer": "National College Sports Association",
            "college": "Bangalore University Grounds",
            "tags": json.dumps(["Sports", "Cricket", "Athletics", "Tournament"]),
            "prize_pool": "₹1,00,000 + Trophies",
            "eligibility": "College Cricket Teams & Players",
            "is_featured": 0,
            "is_trending": 0,
            "is_virtual": 0,
            "is_upcoming": 1,
            "rating": 4.8
        },
        {
            "title": "Pulse 2026 - Inter-College Cultural & Music Fest",
            "slug": "pulse-2026-cultural-music-fest",
            "subtitle": "Battle of the Bands, Pro-Nites, Street Play & Dance Battles",
            "description": "Experience South India's biggest multi-genre college cultural festival featuring 40+ events, celebrity DJ performances, and high-energy music battles.",
            "category": "Cultural",
            "mode": "OFFLINE",
            "location": "Coimbatore",
            "venue": "Kumaraguru Open Air Amphitheatre, Coimbatore",
            "date": "18 Nov 2026",
            "start_date": "2026-11-18",
            "end_date": "2026-11-20",
            "price": "₹350",
            "price_numeric": 350.0,
            "views_count": 3400,
            "views_display": "3.4K",
            "registrations_count": 1200,
            "image_url": "/static/images/concert-live-event.jpeg",
            "organizer": "KCT Cultural Committee",
            "college": "Kumaraguru College of Technology, Coimbatore",
            "tags": json.dumps(["Cultural", "Music", "Dance", "Fest", "Pro-Nite"]),
            "prize_pool": "₹3,50,000 Cash Prizes",
            "eligibility": "Open to all College & University Students",
            "is_featured": 1,
            "is_trending": 1,
            "is_virtual": 0,
            "is_upcoming": 1,
            "rating": 4.9
        }
    ]

    for ev in events_data:
        cursor.execute("""
        INSERT INTO events (
            title, slug, subtitle, description, category, mode, location, venue,
            date, start_date, end_date, price, price_numeric, views_count, views_display,
            registrations_count, image_url, organizer, college, tags, prize_pool,
            eligibility, is_featured, is_trending, is_virtual, is_upcoming, rating
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        """, (
            ev["title"], ev["slug"], ev["subtitle"], ev["description"], ev["category"],
            ev["mode"], ev["location"], ev["venue"], ev["date"], ev["start_date"],
            ev["end_date"], ev["price"], ev["price_numeric"], ev["views_count"],
            ev["views_display"], ev["registrations_count"], ev["image_url"],
            ev["organizer"], ev["college"], ev["tags"], ev["prize_pool"],
            ev["eligibility"], ev["is_featured"], ev["is_trending"], ev["is_virtual"],
            ev["is_upcoming"], ev["rating"]
        ))

    # Seed initial sample notifications
    notifications_data = [
        {
            "title": "🌟 HACKACE 2026 – Turn Your Hackathon Success into Opportunities!",
            "message": "Shortlisted Hackathon Participants are being offered: 💼 Internship Opportunities 🌟 Campus Ambassador Opportunities 🏆 Best Performers will also have the opportunity to receive a stipend!",
            "icon": "star",
            "timestamp": "2026-08-29T13:16:07.365Z",
            "is_read": 0
        },
        {
            "title": "🏆 HACKNIMA 2026 – Round 1 Results Declared",
            "message": "The jury has announced the top 20 teams qualifying for the 36-hour physical grand finale in Coimbatore. Check your inbox for mentor allocations.",
            "icon": "trophy",
            "timestamp": "2026-08-28T10:45:00.000Z",
            "is_read": 0
        },
        {
            "title": "⚡ HackGURU 2026 Registrations Open",
            "message": "India's premier AI & Agentic coding hackathon is now accepting team applications. Secure your slot early!",
            "icon": "zap",
            "timestamp": "2026-08-27T08:30:00.000Z",
            "is_read": 1
        }
    ]

    for n in notifications_data:
        cursor.execute("""
        INSERT INTO notifications (title, message, icon, timestamp, is_read)
        VALUES (?, ?, ?, ?, ?)
        """, (n["title"], n["message"], n["icon"], n["timestamp"], n["is_read"]))

    # Seed baseline bookmarks & interactions
    cursor.execute("INSERT OR IGNORE INTO bookmarks (user_id, event_id, type) VALUES ('usr_kishor', 1, 'bookmark')")
    cursor.execute("INSERT OR IGNORE INTO bookmarks (user_id, event_id, type) VALUES ('usr_kishor', 2, 'wishlist')")

    cursor.execute("INSERT INTO user_interactions (user_id, event_id, interaction_type, weight) VALUES ('usr_kishor', 1, 'view', 1.0)")
    cursor.execute("INSERT INTO user_interactions (user_id, event_id, interaction_type, weight) VALUES ('usr_kishor', 1, 'bookmark', 3.0)")
    cursor.execute("INSERT INTO user_interactions (user_id, event_id, interaction_type, weight) VALUES ('usr_kishor', 2, 'view', 1.0)")
    cursor.execute("INSERT INTO user_interactions (user_id, event_id, interaction_type, weight) VALUES ('usr_kishor', 3, 'view', 1.0)")

    conn.commit()
    conn.close()

    # Precompute and sync embeddings into SQLite BLOB storage
    sync_event_embeddings(db_path=db_path)

    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM events")
    total = cursor.fetchone()[0]
    conn.close()
    return total


def sync_event_embeddings(db_path=None, force=False):
    """
    Ensures all events in the database have their dense embeddings computed
    and persisted in the event_embeddings table as raw float32 BLOBs.
    """
    from core.embedder import ONNXEmbedder, create_event_embedding_text

    conn = get_db_connection(db_path)
    cursor = conn.cursor()

    if force:
        cursor.execute("DELETE FROM event_embeddings")
        conn.commit()

    # Find events missing embeddings
    cursor.execute("""
        SELECT e.* FROM events e
        LEFT JOIN event_embeddings ee ON e.id = ee.event_id
        WHERE ee.event_id IS NULL
    """)
    missing_events = [dict(r) for r in cursor.fetchall()]

    if not missing_events:
        conn.close()
        return 0

    embedder = ONNXEmbedder()
    texts = [create_event_embedding_text(e) for e in missing_events]
    vectors = embedder.encode(texts)

    for event, vec in zip(missing_events, vectors):
        blob = vec.astype("float32").tobytes()
        cursor.execute("""
            INSERT OR REPLACE INTO event_embeddings (event_id, embedding, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
        """, (event["id"], blob))

    conn.commit()
    count = len(missing_events)
    conn.close()
    return count


if __name__ == "__main__":
    count = seed_db(force=True)
    print(f"Database initialized and seeded with {count} events and computed embeddings.")
