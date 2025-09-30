// Production Debug Script - Diagnose API Issues
const https = require('https');
const http = require('http');

console.log('🔍 Production API Debug Tool');
console.log('============================');

// Test function to make HTTP requests
const testAPI = (url, description) => {
    return new Promise((resolve, reject) => {
        console.log(`\n🧪 Testing: ${description}`);
        console.log(`📍 URL: ${url}`);
        
        const client = url.startsWith('https') ? https : http;
        
        const req = client.get(url, (res) => {
            let data = '';
            
            console.log(`📊 Status: ${res.statusCode}`);
            console.log(`📋 Headers:`, res.headers);
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    console.log(`✅ Response: ${JSON.stringify(jsonData, null, 2)}`);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (e) {
                    console.log(`📄 Raw Response: ${data.substring(0, 500)}...`);
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });
        
        req.on('error', (error) => {
            console.error(`❌ Error: ${error.message}`);
            reject(error);
        });
        
        req.setTimeout(10000, () => {
            console.error(`⏰ Timeout: Request took too long`);
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
};

// Main debug function
const runDebug = async () => {
    const baseUrl = 'http://localhost:3001';
    
    console.log(`🎯 Base URL: ${baseUrl}`);
    console.log(`🏗️ Environment: ${process.env.NODE_ENV || 'unknown'}`);
    
    try {
        // Test 1: Basic health check
        await testAPI(`${baseUrl}/sm-admin/api/health`, 'Health Check API');
        
        // Test 2: Chat statistics API (without auth)
        await testAPI(`${baseUrl}/sm-admin/api/monitoring/chat-stats`, 'Chat Stats API (no auth)');
        
        // Test 3: Chat history API (without auth)
        await testAPI(`${baseUrl}/sm-admin/api/chat/history-filtered`, 'Chat History API (no auth)');
        
        // Test 4: Login API
        const loginPayload = JSON.stringify({
            email: 'hris@sinarmasmining.com',
            password: 'admin123'
        });
        
        console.log('\n🔐 Testing Login API...');
        const loginResponse = await new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: 3001,
                path: '/sm-admin/api/login',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(loginPayload)
                }
            };
            
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        console.log(`✅ Login Status: ${res.statusCode}`);
                        console.log(`🔑 Login Response:`, jsonData);
                        resolve(jsonData);
                    } catch (e) {
                        console.log(`❌ Login Parse Error:`, e.message);
                        resolve({ error: 'Parse error', data });
                    }
                });
            });
            
            req.on('error', reject);
            req.write(loginPayload);
            req.end();
        });
        
        // Test 5: If login successful, test authenticated APIs
        if (loginResponse.token) {
            console.log('\n🎉 Login successful! Testing authenticated APIs...');
            
            const authHeaders = {
                'Authorization': `Bearer ${loginResponse.token}`,
                'Content-Type': 'application/json'
            };
            
            // Test authenticated chat stats
            console.log('\n🧪 Testing authenticated chat stats...');
            await new Promise((resolve) => {
                const options = {
                    hostname: 'localhost',
                    port: 3001,
                    path: '/sm-admin/api/monitoring/chat-stats?days=7',
                    method: 'GET',
                    headers: authHeaders
                };
                
                const req = http.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => {
                        console.log(`📊 Auth Chat Stats Status: ${res.statusCode}`);
                        try {
                            const jsonData = JSON.parse(data);
                            console.log(`✅ Auth Chat Stats Response:`, JSON.stringify(jsonData, null, 2));
                        } catch (e) {
                            console.log(`📄 Auth Chat Stats Raw:`, data.substring(0, 200));
                        }
                        resolve();
                    });
                });
                
                req.on('error', (err) => {
                    console.error(`❌ Auth Chat Stats Error:`, err.message);
                    resolve();
                });
                
                req.end();
            });
            
            // Test authenticated chat history
            console.log('\n🧪 Testing authenticated chat history...');
            await new Promise((resolve) => {
                const options = {
                    hostname: 'localhost',
                    port: 3001,
                    path: '/sm-admin/api/chat/history-filtered?page=1&limit=5',
                    method: 'GET',
                    headers: authHeaders
                };
                
                const req = http.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => {
                        console.log(`📊 Auth Chat History Status: ${res.statusCode}`);
                        try {
                            const jsonData = JSON.parse(data);
                            console.log(`✅ Auth Chat History Response:`, JSON.stringify(jsonData, null, 2));
                        } catch (e) {
                            console.log(`📄 Auth Chat History Raw:`, data.substring(0, 200));
                        }
                        resolve();
                    });
                });
                
                req.on('error', (err) => {
                    console.error(`❌ Auth Chat History Error:`, err.message);
                    resolve();
                });
                
                req.end();
            });
        }
        
        console.log('\n🎉 Debug complete!');
        console.log('\n🔧 Next steps:');
        console.log('1. Check server logs for database connection issues');
        console.log('2. Verify port forwarding: gcloud compute ssh gcp-hr-applications -- -L 5488:localhost:5488');
        console.log('3. Check if .env.production is being loaded correctly');
        
    } catch (error) {
        console.error('\n💥 Debug failed:', error.message);
    }
};

// Run the debug
runDebug();