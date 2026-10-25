"""Admin Creation / Seed Script for PGCET Portal.

Creates an administrator account in the database using environment variables
or optional command-line arguments.

Usage:
    python create_admin.py
    python create_admin.py --email admin@pgcet.in --password MySecurePass123! --name "Admin User"
"""

import argparse
import os
import sys
from dotenv import load_dotenv

# Ensure backend root is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from app.database import SessionLocal
from app.models.user import User
from app.auth.security import hash_password


def create_or_update_admin(name: str, email: str, password: str, reset: bool = False):
    email = email.strip().lower()
    name = name.strip()

    if len(password) < 6:
        print("[ERROR] Password must be at least 6 characters long.", file=sys.stderr)
        sys.exit(1)

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            if reset or user.role != "admin":
                user.name = name
                user.role = "admin"
                user.password_hash = hash_password(password)
                db.commit()
                print(f"[SUCCESS] Updated existing user '{email}' to Admin with new credentials.")
            else:
                print(f"[INFO] Admin user with email '{email}' already exists. No changes made.")
                print("       Use --reset to force update password and profile.")
        else:
            new_admin = User(
                name=name,
                email=email,
                password_hash=hash_password(password),
                role="admin",
            )
            db.add(new_admin)
            db.commit()
            db.refresh(new_admin)
            print(f"[SUCCESS] Successfully created Admin user: ID #{new_admin.id} | Email: {new_admin.email}")
    except Exception as exc:
        db.rollback()
        print(f"[ERROR] Failed to create admin user: {exc}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Create or seed PGCET Portal Admin User")
    parser.add_argument(
        "--name",
        default=os.getenv("ADMIN_NAME", "System Administrator"),
        help="Full name of admin user (default: ADMIN_NAME env or 'System Administrator')",
    )
    parser.add_argument(
        "--email",
        default=os.getenv("ADMIN_EMAIL", "admin@pgcet.in"),
        help="Email address of admin user (default: ADMIN_EMAIL env or 'admin@pgcet.in')",
    )
    parser.add_argument(
        "--password",
        default=os.getenv("ADMIN_PASSWORD", "Admin@12345"),
        help="Password for admin user (default: ADMIN_PASSWORD env or 'Admin@12345')",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Force reset password and name if user already exists",
    )

    args = parser.parse_args()
    create_or_update_admin(
        name=args.name,
        email=args.email,
        password=args.password,
        reset=args.reset,
    )


if __name__ == "__main__":
    main()
