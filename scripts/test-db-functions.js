const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL;

async function runTests() {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    console.log('Testing live Neon database atomic functions & triggers...');

    // 1. Create test user 1 & 2
    const user1Id = '11111111-1111-1111-1111-111111111111';
    const user2Id = '22222222-2222-2222-2222-222222222222';
    const orgId = '33333333-3333-3333-3333-333333333333';
    const eventId = '44444444-4444-4444-4444-444444444444';

    // Cleanup any prior test run leftovers
    await client.query(`DELETE FROM public.event_attendance WHERE event_id = $1`, [eventId]);
    await client.query(`DELETE FROM public.events WHERE id = $1`, [eventId]);
    await client.query(`DELETE FROM public.organization_members WHERE organization_id = $1`, [orgId]);
    await client.query(`DELETE FROM public.organizations WHERE id = $1`, [orgId]);
    await client.query(`DELETE FROM public.user_tag_writes WHERE user_id IN ($1, $2)`, [user1Id, user2Id]);
    await client.query(`DELETE FROM public.user_tag_pending WHERE user_id IN ($1, $2)`, [user1Id, user2Id]);
    await client.query(`DELETE FROM public.users WHERE id IN ($1, $2)`, [user1Id, user2Id]);
    await client.query(`DELETE FROM auth.users WHERE id IN ($1, $2)`, [user1Id, user2Id]);

    // Insert user 1
    console.log('Test 1: Inserting user into public.users and checking auth.users sync...');
    await client.query(`
      INSERT INTO public.users (id, email, name, user_type)
      VALUES ($1, 'testuser1@example.com', 'Test User 1', 'Student')
    `, [user1Id]);

    const authUserRes = await client.query(`SELECT id, email FROM auth.users WHERE id = $1`, [user1Id]);
    if (authUserRes.rowCount !== 1) {
      throw new Error('ensure_auth_user trigger failed to sync user to auth.users');
    }
    console.log('  ✓ User created and synced to auth.users successfully.');

    // Insert user 2
    await client.query(`
      INSERT INTO public.users (id, email, name, user_type)
      VALUES ($1, 'testuser2@example.com', 'Test User 2', 'Faculty')
    `, [user2Id]);

    // Test tag cooldown & prepare
    console.log('Test 2: Testing can_user_write_tag and prepare_tag_write...');
    const canWriteRes = await client.query(`SELECT public.can_user_write_tag($1) AS res`, [user1Id]);
    if (!canWriteRes.rows[0].res.can_write) {
      throw new Error('Expected can_user_write_tag to return true for new user');
    }
    console.log('  ✓ can_user_write_tag returned can_write: true.');

    const prepRes = await client.query(`SELECT public.prepare_tag_write($1) AS res`, [user1Id]);
    const pendingId = prepRes.rows[0].res.pending_id;
    const generatedTagId = prepRes.rows[0].res.tag_id;
    if (!pendingId || !generatedTagId) {
      throw new Error('prepare_tag_write did not return valid pending_id / tag_id');
    }
    console.log('  ✓ prepare_tag_write generated pending_id:', pendingId);

    // Test confirm tag write
    console.log('Test 3: Testing confirm_tag_write...');
    const confirmRes = await client.query(`SELECT public.confirm_tag_write($1, $2) AS res`, [user1Id, pendingId]);
    if (!confirmRes.rows[0].res.success) {
      throw new Error('confirm_tag_write failed');
    }

    const userCheck = await client.query(`SELECT tag_id, nfc_tag_id, qr_code_data FROM public.users WHERE id = $1`, [user1Id]);
    if (userCheck.rows[0].tag_id !== generatedTagId || userCheck.rows[0].nfc_tag_id !== generatedTagId) {
      throw new Error('Tag sync trigger failed to set tag_id and nfc_tag_id');
    }
    console.log('  ✓ confirm_tag_write succeeded and tag synchronized to nfc_tag_id.');

    // Test cooldown now active
    console.log('Test 4: Testing cooldown enforcement...');
    const canWriteAfter = await client.query(`SELECT public.can_user_write_tag($1) AS res`, [user1Id]);
    if (canWriteAfter.rows[0].res.can_write) {
      throw new Error('Cooldown should have prevented tag write immediately after confirmation');
    }
    console.log('  ✓ Cooldown correctly enforced (can_write: false).');

    // Test Organization creation & membership
    console.log('Test 5: Testing Organization ownership and transfer...');
    await client.query(`
      INSERT INTO public.organizations (id, name, owner_user_id)
      VALUES ($1, 'Test Org', $2)
    `, [orgId, user1Id]);

    await client.query(`
      INSERT INTO public.organization_members (organization_id, user_id, role)
      VALUES ($1, $2, 'Owner')
    `, [orgId, user1Id]);

    await client.query(`
      INSERT INTO public.organization_members (organization_id, user_id, role)
      VALUES ($1, $2, 'Member')
    `, [orgId, user2Id]);

    // Test ownership transfer
    const transferRes = await client.query(`SELECT public.transfer_organization_ownership($1, $2) AS res`, [orgId, user2Id]);
    if (!transferRes.rows[0].res) {
      throw new Error('transfer_organization_ownership returned false');
    }

    const orgCheck = await client.query(`SELECT owner_user_id FROM public.organizations WHERE id = $1`, [orgId]);
    if (orgCheck.rows[0].owner_user_id !== user2Id) {
      throw new Error('Organization owner was not updated to user2');
    }
    console.log('  ✓ Ownership successfully transferred to user 2.');

    // Test can_take_attendance & mark_attendance
    console.log('Test 6: Testing attendance permissions and mark_attendance...');
    // Create an event with user2 as owner, radius = 500m at (14.5995, 120.9842)
    const now = new Date();
    const eventStart = new Date(now.getTime() - 10 * 60000); // 10 mins ago
    const eventEnd = new Date(now.getTime() + 60 * 60000); // 1 hr later

    await client.query(`
      INSERT INTO public.events (id, organization_id, event_name, date, event_start, event_end, latitude, longitude, attendance_radius_meters, created_by)
      VALUES ($1, $2, 'Test Tech Conference', $3, $3, $4, 14.5995, 120.9842, 500, $5)
    `, [eventId, orgId, eventStart, eventEnd, user2Id]);

    // user2 is owner so user2 can take attendance
    const canTakeRes = await client.query(`SELECT public.can_take_attendance($1, $2) AS res`, [eventId, user2Id]);
    if (!canTakeRes.rows[0].res) {
      throw new Error('Owner should be permitted to take attendance');
    }
    console.log('  ✓ can_take_attendance permitted user 2.');

    // Attempt attendance from far away (latitude 20.0, longitude 120.0) -> should fail geofence
    console.log('Test 7: Geofence radius violation check...');
    let geofenceFailed = false;
    try {
      await client.query(`
        SELECT public.mark_attendance($1, $2, $3, 'NFC', 20.0, 120.0, 'Testing outside radius')
      `, [eventId, user1Id, user2Id]);
    } catch (err) {
      geofenceFailed = true;
      console.log('  ✓ Correctly rejected out-of-range location:', err.message);
    }
    if (!geofenceFailed) {
      throw new Error('Expected mark_attendance to fail due to geofence radius');
    }

    // Mark attendance with valid coordinates (14.5995, 120.9842)
    console.log('Test 8: Mark attendance within radius...');
    const markRes = await client.query(`
      SELECT public.mark_attendance($1, $2, $3, 'NFC', 14.5995, 120.9842, 'Valid checkin') AS res
    `, [eventId, user1Id, user2Id]);
    if (!markRes.rows[0].res.success) {
      throw new Error('mark_attendance failed for valid coordinates');
    }
    console.log('  ✓ mark_attendance succeeded for user 1.');

    // Duplicate check-in check
    console.log('Test 9: Duplicate attendance prevention check...');
    let duplicateFailed = false;
    try {
      await client.query(`
        SELECT public.mark_attendance($1, $2, $3, 'NFC', 14.5995, 120.9842, 'Duplicate checkin')
      `, [eventId, user1Id, user2Id]);
    } catch (err) {
      duplicateFailed = true;
      console.log('  ✓ Correctly rejected duplicate check-in:', err.message);
    }
    if (!duplicateFailed) {
      throw new Error('Expected duplicate check-in to be rejected');
    }

    // Test location suggestions
    console.log('Test 10: Location suggestions check...');
    const locRes = await client.query(`
      SELECT * FROM public.get_location_suggestions($1, 'Tech')
    `, [orgId]);
    console.log(`  ✓ get_location_suggestions returned ${locRes.rowCount} results.`);

    // Cleanup test data
    console.log('Cleaning up test records...');
    await client.query(`DELETE FROM public.event_attendance WHERE event_id = $1`, [eventId]);
    await client.query(`DELETE FROM public.events WHERE id = $1`, [eventId]);
    await client.query(`DELETE FROM public.organization_members WHERE organization_id = $1`, [orgId]);
    await client.query(`DELETE FROM public.organizations WHERE id = $1`, [orgId]);
    await client.query(`DELETE FROM public.user_tag_writes WHERE user_id IN ($1, $2)`, [user1Id, user2Id]);
    await client.query(`DELETE FROM public.user_tag_pending WHERE user_id IN ($1, $2)`, [user1Id, user2Id]);
    await client.query(`DELETE FROM public.users WHERE id IN ($1, $2)`, [user1Id, user2Id]);
    await client.query(`DELETE FROM auth.users WHERE id IN ($1, $2)`, [user1Id, user2Id]);

    console.log('\nALL 10 DATABASE ATOMIC FUNCTION & TRIGGER TESTS PASSED SUCCESSFULLY!');
  } finally {
    client.release();
    await pool.end();
  }
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
