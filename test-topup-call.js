require('dotenv').config({ path: '.env.local' });

const ESIMACCESS_API_URL = 'https://api.esimaccess.com/api/v1/open';
const accessCode = process.env.ESIMACCESS_ACCESS_CODE;

async function testTopUp() {
  // Simulate what the webhook would do
  const iccid = '8943108170002618622';
  const attemptedSku = 'PVA0GD3V7';  // What Josh tried to buy

  // Step 1: Get available top-up packages for this ICCID
  console.log('=== STEP 1: GET AVAILABLE TOP-UP PACKAGES ===');
  const listResponse = await fetch(`${ESIMACCESS_API_URL}/package/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'RT-AccessCode': accessCode
    },
    body: JSON.stringify({ iccid })
  });
  const listData = await listResponse.json();
  console.log('API Success:', listData.success);

  const packages = listData.obj?.packageList || [];
  console.log('Total packages for ICCID:', packages.length);

  // Step 2: Find matching package
  console.log('\n=== STEP 2: FIND MATCHING PACKAGE ===');
  const matchingPkg = packages.find(pkg => pkg.packageCode === attemptedSku);
  console.log('Looking for packageCode:', attemptedSku);
  console.log('Found match:', matchingPkg ? 'YES' : 'NO');
  if (matchingPkg) {
    console.log('Match details:');
    console.log('  - slug:', matchingPkg.slug);
    console.log('  - name:', matchingPkg.name);
    console.log('  - supportTopUpType:', matchingPkg.supportTopUpType);
  }

  // Step 3: Try the actual top-up call (dry run - won't actually charge)
  console.log('\n=== STEP 3: SIMULATED TOP-UP CALL ===');
  const topUpSlug = matchingPkg?.slug || attemptedSku;
  console.log('Would call esim/order with:');
  console.log('  - iccid:', iccid);
  console.log('  - packageCode:', topUpSlug);

  // Let's also check what supportTopUpType means
  console.log('\n=== SUPPORT TOP-UP TYPE ANALYSIS ===');
  const typeCounts = {};
  packages.forEach(p => {
    typeCounts[p.supportTopUpType] = (typeCounts[p.supportTopUpType] || 0) + 1;
  });
  console.log('Distribution of supportTopUpType:', typeCounts);

  // Check if CKH693 (original) is in the list
  const originalPkg = packages.find(pkg => pkg.packageCode === 'CKH693');
  console.log('\nOriginal package (CKH693) in list?', originalPkg ? 'YES' : 'NO');
  if (originalPkg) {
    console.log('  - slug:', originalPkg.slug);
    console.log('  - supportTopUpType:', originalPkg.supportTopUpType);
  }
}

testTopUp().catch(console.error);
