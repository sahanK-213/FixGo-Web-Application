# 🚀 FixGo Database Management Guide

> [!NOTE]  
> **Docker Users:** You do not need to run these setup commands manually! When you run `docker-compose up`, Docker automatically creates the database, runs the migrations, and seeds the test data for you. The manual setup instructions in Section 1 are **only required for Bare Metal (Local PHP/XAMPP)** environments.

To ensure every developer's local database is synchronized and our cloud CI/CD deployments are seamless, **we strictly manage our database schema as code.**

Never use phpMyAdmin or DataGrip to manually add columns or insert core data. Everything must be scripted.

---

## 1. Local Database Setup (Migrations + Seeding)

If you are setting up the project for the first time, you need to build the database schema and populate it with mock data.

**Step 1: Create the Blank Database (Bare Metal Only)**
*Note: If you are using Docker, skip this step as Docker creates it automatically.*
Open phpMyAdmin or your MySQL CLI and create a new, empty database matching your `.env` file (e.g., `CREATE DATABASE fixgo_web;`).

**Step 2: Run Migrations (Schema)**
This builds all the tables and columns.
```bash
php database/migrate.php
```

**Step 3: Run the Seeder (Mock Data)**
This populates the tables with test users, shops, and default settings so you can log in immediately.
```bash
php database/seed.php
```

---

## 2. How to Modify the Database Schema

If you are building a feature that requires a new table or a new column, you must write a **Migration**.

> [!WARNING]
> **The Golden Rule:** Never edit an existing `.sql` migration file once it has been merged to the `development` branch. If you made a mistake in `001_initial_baseline.sql`, you must create `002_fix_mistake.sql` to correct it. 

### Creating a New Migration:
1. Navigate to the `backend/database/migrations/` folder.
2. Create a new `.sql` file, numbered sequentially. *(Example: `002_add_loyalty_points.sql`)*.
3. Write your raw MySQL command inside this file:
   ```sql
   ALTER TABLE customer ADD COLUMN loyalty_points INT DEFAULT 0;
   ```
4. Run `php database/migrate.php` locally to test it.
5. Commit the file. When merged, the GitHub Actions CI/CD pipeline will automatically run this script on the Azure production database.

---

## 3. Pulling Teammate Updates

If a teammate adds a new database feature and merges it, you must sync your local database so your app does not crash.

1. Pull the latest code: `git pull origin development`
2. Run the migration script: `php database/migrate.php`

*(The migration script is intelligent. It checks the `migrations_tracker` table in your database and will **only** run the new `.sql` files that your teammate added, skipping the ones you already have).*