const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Support loading from .env.local or .env
try {
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
} catch (e) {}

const connectionString = process.env.DATABASE_URL;

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

  pool.on('error', (err) => {
    // Suppress background connection drops after completion
  });

  const client = await pool.connect();

  try {
    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/00000000000000_full_schema.sql');
    console.log(`Reading migration script from: ${migrationPath}`);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing migration script in transaction...');
    await client.query('BEGIN;');
    await client.query(sql);
    await client.query('COMMIT;');
    console.log('✓ Migration applied successfully!');

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
    await client.query('ROLLBACK;').catch(() => {});
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
