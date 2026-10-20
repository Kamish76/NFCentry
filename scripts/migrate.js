const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Support loading from .env.local or .env
try {
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
} catch (e) {}

// Migrations need a direct (unpooled) connection; Neon-Vercel integration provides it.
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: DATABASE_URL is not set in environment or .env.local');
  process.exit(1);
}

async function runMigration() {
  console.log('Connecting to Neon PostgreSQL database...');
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
  });

  pool.on('error', () => {});

  const client = await pool.connect();

  try {
    // 1. Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public._migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Fetch already applied migrations
    const appliedRes = await client.query('SELECT name FROM public._migrations');
    const applied = new Set(appliedRes.rows.map(r => r.name));

    // 3. Read all .sql files in migrations/ sorted alphabetically
    const migrationsDir = path.resolve(process.cwd(), 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found.');
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    let appliedCount = 0;

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`- Skipping already applied migration: ${file}`);
        continue;
      }

      console.log(`Applying migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        await client.query('BEGIN;');
        await client.query(sql);
        await client.query('INSERT INTO public._migrations (name) VALUES ($1);', [file]);
        await client.query('COMMIT;');
        console.log(`✓ Applied: ${file}`);
        appliedCount++;
      } catch (err) {
        await client.query('ROLLBACK;').catch(() => {});
        throw new Error(`Failed to apply migration ${file}: ${err.message}`);
      }
    }

    if (appliedCount === 0) {
      console.log('✓ Database schema is up to date. No pending migrations.');
    } else {
      console.log(`✓ Successfully applied ${appliedCount} migration file(s).`);
    }

    // Release client back to pool before verification queries
    client.release();

    // Verification of tables
    console.log('\n--- Verifying Tables ---');
    const expectedTables = [
      'users',
      'organizations',
      'organization_members',
      'organization_join_requests',
      'events',
      'event_attendance',
      'event_files',
      'user_tag_writes',
      'user_tag_pending'
    ];

    const tableRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    const tables = new Set(tableRes.rows.map(r => r.table_name));

    for (const t of expectedTables) {
      if (tables.has(t)) {
        console.log(`  ✓ Table public.${t} exists`);
      } else {
        console.error(`  ✗ Table public.${t} MISSING!`);
      }
    }

    // Verification of views
    console.log('\n--- Verifying Views ---');
    const expectedViews = [
      'events_with_details',
      'upcoming_events',
      'past_events',
      'membership_with_organization',
      'membership_with_user',
      'attendance_with_details',
      'event_attendance_summary'
    ];

    const viewRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
    `);
    const views = new Set(viewRes.rows.map(r => r.table_name));

    for (const v of expectedViews) {
      if (views.has(v)) {
        console.log(`  ✓ View public.${v} exists`);
      } else {
        console.error(`  ✗ View public.${v} MISSING!`);
      }
    }

    // Verification of atomic functions
    console.log('\n--- Verifying Atomic Functions ---');
    const expectedFunctions = [
      'mark_attendance',
      'can_take_attendance',
      'prepare_tag_write',
      'confirm_tag_write',
      'transfer_organization_ownership',
      'approve_join_request',
      'can_user_write_tag',
      'generate_and_assign_tag',
      'cleanup_expired_pending_tags',
      'cleanup_expired_event_files',
      'get_location_suggestions'
    ];

    const fnRes = await pool.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
    `);
    const routines = new Set(fnRes.rows.map(r => r.routine_name));

    for (const f of expectedFunctions) {
      if (routines.has(f)) {
        console.log(`  ✓ Function public.${f}() exists`);
      } else {
        console.error(`  ✗ Function public.${f}() MISSING!`);
      }
    }

    console.log('\nAll core database objects successfully verified!');
  } catch (err) {
    client.release();
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
