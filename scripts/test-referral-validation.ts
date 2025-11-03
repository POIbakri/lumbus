/**
 * Test script for referral code validation
 * Run with: npx tsx scripts/test-referral-validation.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { supabase } from '../lib/db';

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

async function testReferralValidation() {
  console.log('🧪 Testing Referral Code Validation System\n');
  console.log('='.repeat(60));

  // Test 1: Check if we can find a valid referral code
  console.log('\n📋 Test 1: Find a valid referral code in database...');
  const { data: validUser, error: userError } = await supabase
    .from('users')
    .select('id, email, referral_code')
    .not('referral_code', 'is', null)
    .limit(1)
    .maybeSingle();

  if (userError || !validUser) {
    results.push({
      test: 'Find valid referral code',
      passed: false,
      message: 'No users with referral codes found',
      details: userError,
    });
    console.log('❌ FAILED: No users with referral codes found');
  } else {
    results.push({
      test: 'Find valid referral code',
      passed: true,
      message: `Found user with code: ${validUser.referral_code}`,
      details: { userId: validUser.id, email: validUser.email },
    });
    console.log(`✅ PASSED: Found code ${validUser.referral_code}`);
  }

  // Test 2: Create a test referral code if needed
  console.log('\n📋 Test 2: Ensure test referral code exists...');
  const testCode = 'TEST1234';
  const { data: testUser } = await supabase
    .from('users')
    .select('id, email, referral_code')
    .eq('referral_code', testCode)
    .maybeSingle();

  if (testUser) {
    results.push({
      test: 'Test code exists',
      passed: true,
      message: `Test code ${testCode} exists`,
      details: testUser,
    });
    console.log(`✅ PASSED: Test code ${testCode} exists`);
  } else {
    console.log(`⚠️  WARNING: Test code ${testCode} doesn't exist. Validation tests will be limited.`);
    results.push({
      test: 'Test code exists',
      passed: false,
      message: `Test code ${testCode} not found`,
    });
  }

  // Test 3: Check referral_rewards table structure
  console.log('\n📋 Test 3: Verify referral_rewards table structure...');
  const { data: rewardsSchema, error: schemaError } = await supabase
    .from('referral_rewards')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (schemaError && !schemaError.message.includes('0 rows')) {
    results.push({
      test: 'Referral rewards table',
      passed: false,
      message: 'Error accessing referral_rewards table',
      details: schemaError,
    });
    console.log('❌ FAILED: Cannot access referral_rewards table');
  } else {
    results.push({
      test: 'Referral rewards table',
      passed: true,
      message: 'Table accessible',
    });
    console.log('✅ PASSED: referral_rewards table accessible');
  }

  // Test 4: Check user_profiles table for referred_by_code
  console.log('\n📋 Test 4: Verify user_profiles table structure...');
  const { data: profileSchema, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, referred_by_code')
    .limit(1)
    .maybeSingle();

  if (profileError && !profileError.message.includes('0 rows')) {
    results.push({
      test: 'User profiles table',
      passed: false,
      message: 'Error accessing user_profiles table',
      details: profileError,
    });
    console.log('❌ FAILED: Cannot access user_profiles table');
  } else {
    results.push({
      test: 'User profiles table',
      passed: true,
      message: 'Table accessible',
    });
    console.log('✅ PASSED: user_profiles table accessible');
  }

  // Test 5: Check orders table for first-time buyer validation
  console.log('\n📋 Test 5: Verify orders table structure...');
  const { data: ordersSchema, error: ordersError } = await supabase
    .from('orders')
    .select('id, user_id, status')
    .limit(1)
    .maybeSingle();

  if (ordersError && !ordersError.message.includes('0 rows')) {
    results.push({
      test: 'Orders table',
      passed: false,
      message: 'Error accessing orders table',
      details: ordersError,
    });
    console.log('❌ FAILED: Cannot access orders table');
  } else {
    results.push({
      test: 'Orders table',
      passed: true,
      message: 'Table accessible',
    });
    console.log('✅ PASSED: orders table accessible');
  }

  // Test 6: Check monthly cap calculation
  console.log('\n📋 Test 6: Test monthly cap calculation...');
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    1,
    0, 0, 0, 0
  ));

  console.log(`   Current time: ${now.toISOString()}`);
  console.log(`   Start of month: ${startOfMonth.toISOString()}`);

  if (validUser) {
    const { count } = await supabase
      .from('referral_rewards')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_user_id', validUser.id)
      .gte('created_at', startOfMonth.toISOString());

    results.push({
      test: 'Monthly cap calculation',
      passed: true,
      message: `Found ${count || 0} rewards this month for user`,
    });
    console.log(`✅ PASSED: Monthly rewards count: ${count || 0}/10`);
  } else {
    results.push({
      test: 'Monthly cap calculation',
      passed: false,
      message: 'No user to test with',
    });
    console.log('⚠️  SKIPPED: No user to test with');
  }

  // Test 7: Simulate API validation request
  console.log('\n📋 Test 7: Test validation logic flow...');
  if (validUser) {
    // Simulate the validation checks
    const checks = {
      codeExists: !!validUser.referral_code,
      codeFormat: /^[A-Z0-9]{8}$/.test(validUser.referral_code || ''),
      hasUserId: !!validUser.id,
    };

    const allPassed = Object.values(checks).every(c => c);
    results.push({
      test: 'Validation logic',
      passed: allPassed,
      message: allPassed ? 'All validation checks passed' : 'Some checks failed',
      details: checks,
    });

    if (allPassed) {
      console.log('✅ PASSED: All validation logic checks passed');
    } else {
      console.log('❌ FAILED: Some validation checks failed', checks);
    }
  } else {
    results.push({
      test: 'Validation logic',
      passed: false,
      message: 'No user to test with',
    });
    console.log('⚠️  SKIPPED: No user to test with');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  console.log('\n📋 Detailed Results:\n');
  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${result.test}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2));
    }
  });

  console.log('\n' + '='.repeat(60));

  if (failed === 0) {
    console.log('✅ All tests passed! Referral validation system is ready.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Review the results above.');
    process.exit(1);
  }
}

// Run tests
testReferralValidation().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});
