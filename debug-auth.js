// Clear localStorage and test login
console.log('Current token:', localStorage.getItem('token'));
localStorage.removeItem('token');
console.log('Token cleared. Please log in again.');

// Function to test login
async function testLogin() {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'hris@sinarmasmining.com',
        password: 'Hr152019!'
      })
    });
    
    const result = await response.json();
    console.log('Login response:', result);
    
    if (result.success) {
      localStorage.setItem('token', result.token);
      console.log('Token stored:', result.token);
      
      // Test API call with new token
      const testResponse = await fetch('/api/cc-benefit-mapping', {
        headers: {
          'Authorization': `Bearer ${result.token}`,
          'Content-Type': 'application/json',
        }
      });
      
      console.log('API test response status:', testResponse.status);
      const testResult = await testResponse.json();
      console.log('API test result:', testResult);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// You can call testLogin() in the browser console to test
console.log('Run testLogin() to test the complete flow');