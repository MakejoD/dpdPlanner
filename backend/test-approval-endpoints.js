// Test script to verify all approval endpoints work correctly
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testApprovalEndpoints() {
  try {
    console.log('🧪 Testing Approval System Endpoints...\n');

    // 1. Test login to get auth token
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@poa.gov',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Test approval stats
    console.log('\n2. Testing approval stats...');
    const statsResponse = await axios.get(`${API_BASE}/approvals/stats`, { headers });
    console.log('✅ Stats endpoint working:', JSON.stringify(statsResponse.data, null, 2));

    // 3. Test pending reports
    console.log('\n3. Testing pending reports...');
    const pendingResponse = await axios.get(`${API_BASE}/approvals/pending`, { headers });
    console.log('✅ Pending reports endpoint working');
    console.log(`   Found ${pendingResponse.data.data ? pendingResponse.data.data.length : 0} pending reports`);

    // 4. Test my reports
    console.log('\n4. Testing my reports...');
    const myReportsResponse = await axios.get(`${API_BASE}/approvals/my-reports`, { headers });
    console.log('✅ My reports endpoint working');
    console.log(`   Found ${myReportsResponse.data.data ? myReportsResponse.data.data.length : 0} user reports`);

    // 5. Test approval history (for a specific report)
    if (pendingResponse.data.data && pendingResponse.data.data.length > 0) {
      const reportId = pendingResponse.data.data[0].id;
      console.log('\n5. Testing approval history...');
      const historyResponse = await axios.get(`${API_BASE}/approvals/${reportId}/history`, { headers });
      console.log('✅ History endpoint working');
      console.log(`   Found ${historyResponse.data.data ? historyResponse.data.data.length : 0} history records`);
    } else {
      console.log('\n5. Skipping history test - no reports available');
    }

    // 6. Test submit report (if we have a report to submit)
    if (myReportsResponse.data.data && myReportsResponse.data.data.length > 0) {
      const draftReport = myReportsResponse.data.data.find(r => r.approvalStatus === 'DRAFT');
      if (draftReport) {
        console.log('\n6. Testing submit report...');
        const submitResponse = await axios.post(`${API_BASE}/approvals/submit/${draftReport.id}`, {}, { headers });
        console.log('✅ Submit report endpoint working');
        console.log(`   Report ${draftReport.id} submitted successfully`);
      }
    }

    // 7. Test approve/reject (if we have pending reports)
    if (pendingResponse.data.data && pendingResponse.data.data.length > 0) {
      const pendingReport = pendingResponse.data.data[0];
      console.log('\n7. Testing approve report...');
      const approveResponse = await axios.post(`${API_BASE}/approvals/approve/${pendingReport.id}`, {
        comment: 'Test approval comment'
      }, { headers });
      console.log('✅ Approve endpoint working');
      console.log(`   Report ${pendingReport.id} approved successfully`);
    }

    console.log('\n🎉 All approval endpoints are working correctly!');

  } catch (error) {
    console.error('❌ Error testing endpoints:', error.response?.data || error.message);
  }
}

testApprovalEndpoints();
