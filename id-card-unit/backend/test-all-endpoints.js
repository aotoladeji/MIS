const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let token = '';

async function testAll() {
  try {
    console.log('🧪 Testing all endpoints...\n');

    // 1. Login
    console.log('1️⃣ Testing login...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'MIS001',
      password: 'Mis@ui'
    });
    token = loginRes.data.token;
    console.log('✅ Login successful\n');

    // 2. Test Daily Reports - Fetch
    console.log('2️⃣ Testing fetch daily reports...');
    const fetchReports = await axios.get(`${BASE_URL}/daily-reports`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Found ${fetchReports.data.reports.length} reports\n`);

    // 3. Test Daily Reports - Create
    console.log('3️⃣ Testing create daily report...');
    const createReport = await axios.post(
      `${BASE_URL}/daily-reports`,
      {
        reportDate: new Date().toISOString().split('T')[0],
        cardsCaptured: 10,
        cardsApproved: 8,
        cardsPrinted: 5,
        cardsCollected: 3,
        issuesEncountered: 'Test report'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Daily report created\n');

    // 4. Test Inventory
    console.log('4️⃣ Testing add inventory...');
    const addInventory = await axios.post(
      `${BASE_URL}/inventory`,
      {
        itemName: 'Test PVC Cards',
        quantity: 100,
        unit: 'units'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Inventory added\n');

    // 5. Test Faulty Delivery
    console.log('5️⃣ Testing log faulty delivery...');
    const logFaulty = await axios.post(
      `${BASE_URL}/inventory/faulty`,
      {
        itemName: 'Damaged Cards',
        quantity: 50,
        issueDescription: 'Cards arrived damaged during shipping'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Faulty delivery logged\n');

    // 6. Test Material Request
    console.log('6️⃣ Testing material request...');
    const materialReq = await axios.post(
      `${BASE_URL}/material`,
      {
        itemName: 'Blank PVC Cards',
        quantity: 200,
        urgency: 'high'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Material request created\n');

    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAll();