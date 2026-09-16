#!/usr/bin/env node
/**
 * Quick test script for the registration endpoint
 * Run with: node test-register.js
 */

const http = require('http');

const payload = JSON.stringify({
  email: 'test@example.com',
  password: 'TestPassword123',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log('Testing POST /api/v1/auth/register...\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
    console.log('Headers:', res.headers);
    console.log('\nResponse Body:');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
  console.error('\nMake sure the server is running: npm run dev');
});

req.write(payload);
req.end();
