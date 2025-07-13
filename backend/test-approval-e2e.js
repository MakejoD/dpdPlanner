// Comprehensive end-to-end test for the approval system
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

class ApprovalSystemE2ETest {
  constructor() {
    this.adminToken = null;
    this.directorToken = null;
    this.results = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    this.results.push({ timestamp, message, type });
    
    const symbols = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    console.log(`${symbols[type] || 'ℹ️'} ${message}`);
  }

  async loginUser(email, password, role) {
    try {
      this.log(`🔑 Logging in as ${role}...`);
      
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password
      });

      if (response.data.token) {
        this.log(`✅ ${role} login successful`, 'success');
        return response.data.token;
      } else {
        this.log(`❌ ${role} login failed: ${response.data.message || 'No token received'}`, 'error');
        return null;
      }
    } catch (error) {
      this.log(`❌ ${role} login error: ${error.message}`, 'error');
      return null;
    }
  }

  async testApprovalStats(token, userRole) {
    try {
      this.log(`📊 Testing approval stats for ${userRole}...`);
      
      const response = await axios.get(`${API_BASE}/approvals/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const stats = response.data.data.summary;
        this.log(`✅ Stats working for ${userRole}: ${stats.pending} pending, ${stats.approved} approved`, 'success');
        return stats;
      } else {
        this.log(`❌ Stats failed for ${userRole}`, 'error');
        return null;
      }
    } catch (error) {
      this.log(`❌ Stats error for ${userRole}: ${error.message}`, 'error');
      return null;
    }
  }

  async testPendingReports(token, userRole) {
    try {
      this.log(`📋 Testing pending reports for ${userRole}...`);
      
      const response = await axios.get(`${API_BASE}/approvals/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const reports = response.data.data || [];
        this.log(`✅ Pending reports working for ${userRole}: ${reports.length} reports`, 'success');
        return reports;
      } else {
        this.log(`❌ Pending reports failed for ${userRole}`, 'error');
        return [];
      }
    } catch (error) {
      this.log(`❌ Pending reports error for ${userRole}: ${error.message}`, 'error');
      return [];
    }
  }

  async testMyReports(token, userRole) {
    try {
      this.log(`📝 Testing my reports for ${userRole}...`);
      
      const response = await axios.get(`${API_BASE}/approvals/my-reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const reports = response.data.data || [];
        this.log(`✅ My reports working for ${userRole}: ${reports.length} reports`, 'success');
        return reports;
      } else {
        this.log(`❌ My reports failed for ${userRole}`, 'error');
        return [];
      }
    } catch (error) {
      this.log(`❌ My reports error for ${userRole}: ${error.message}`, 'error');
      return [];
    }
  }

  async testApproveReport(token, reportId, userRole) {
    try {
      this.log(`✅ Testing approve report for ${userRole}...`);
      
      const response = await axios.post(`${API_BASE}/approvals/approve/${reportId}`, {
        comment: `Approved by ${userRole} in E2E test`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        this.log(`✅ Report approval working for ${userRole}`, 'success');
        return true;
      } else {
        this.log(`❌ Report approval failed for ${userRole}: ${response.data.message}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`❌ Report approval error for ${userRole}: ${error.message}`, 'error');
      return false;
    }
  }

  async testReportHistory(token, reportId, userRole) {
    try {
      this.log(`📋 Testing report history for ${userRole}...`);
      
      const response = await axios.get(`${API_BASE}/approvals/${reportId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const history = response.data.data || [];
        this.log(`✅ Report history working for ${userRole}: ${history.length} history entries`, 'success');
        return history;
      } else {
        this.log(`❌ Report history failed for ${userRole}`, 'error');
        return [];
      }
    } catch (error) {
      this.log(`❌ Report history error for ${userRole}: ${error.message}`, 'error');
      return [];
    }
  }

  async runCompleteTest() {
    this.log('🚀 Starting comprehensive approval system E2E test...');
    
    // 1. Login as both users
    this.adminToken = await this.loginUser('admin@poa.gov', 'admin123', 'Admin');
    this.directorToken = await this.loginUser('director@poa.gov', 'admin123', 'Director');

    if (!this.adminToken || !this.directorToken) {
      this.log('❌ Cannot continue without valid logins', 'error');
      return false;
    }

    // 2. Test all endpoints for both users
    const adminStats = await this.testApprovalStats(this.adminToken, 'Admin');
    const directorStats = await this.testApprovalStats(this.directorToken, 'Director');

    const adminPending = await this.testPendingReports(this.adminToken, 'Admin');
    const directorPending = await this.testPendingReports(this.directorToken, 'Director');

    const adminReports = await this.testMyReports(this.adminToken, 'Admin');
    const directorReports = await this.testMyReports(this.directorToken, 'Director');

    // 3. Test approval workflow if there are pending reports
    if (adminPending.length > 0) {
      const reportToApprove = adminPending[0];
      this.log(`🔄 Testing approval workflow with report ${reportToApprove.id}...`);
      
      const approvalSuccess = await this.testApproveReport(this.adminToken, reportToApprove.id, 'Admin');
      
      if (approvalSuccess) {
        await this.testReportHistory(this.adminToken, reportToApprove.id, 'Admin');
      }
    }

    // 4. Final summary
    const totalTests = this.results.length;
    const successfulTests = this.results.filter(r => r.type === 'success').length;
    const failedTests = this.results.filter(r => r.type === 'error').length;

    this.log(`\n📊 TEST SUMMARY:`);
    this.log(`   Total tests: ${totalTests}`);
    this.log(`   Successful: ${successfulTests}`, 'success');
    this.log(`   Failed: ${failedTests}`, failedTests > 0 ? 'error' : 'success');
    this.log(`   Success rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests === 0) {
      this.log('🎉 ALL TESTS PASSED! Approval system is fully functional!', 'success');
      return true;
    } else {
      this.log('⚠️ Some tests failed. Please review the errors above.', 'warning');
      return false;
    }
  }
}

// Run the test
const test = new ApprovalSystemE2ETest();
test.runCompleteTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test suite error:', error.message);
  process.exit(1);
});
