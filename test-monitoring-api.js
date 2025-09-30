// Test script for the Daily Chat Monitoring API
// This can be run in the browser console or as a separate test

async function testMonitoringAPI() {
  try {
    console.log('Testing Daily Chat Monitoring API...');
    
    // Test with different parameters
    const testCases = [
      { days: 7 },
      { days: 30 },
      { days: 60 }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n=== Testing with ${testCase.days} days ===`);
      
      const response = await fetch(`/api/monitoring/daily-chats?days=${testCase.days}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Note: In a real test, you'd need to include the Authorization header
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ Success!');
        console.log(`- Data points: ${data.data.length}`);
        console.log(`- Unique menus: ${data.menus.length}`);
        console.log(`- Period: ${data.period.startDate} to ${data.period.endDate}`);
        console.log(`- Total records: ${data.totalRecords}`);
        
        // Sample data point
        if (data.data.length > 0) {
          console.log('- Sample data point:', data.data[0]);
        }
      } else {
        console.log('❌ Failed!');
        console.log('Response:', data);
      }
    }
    
    console.log('\n=== Test Complete ===');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Uncomment the line below to run the test
// testMonitoringAPI();