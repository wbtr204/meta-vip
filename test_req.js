const http = require('http');

const data = JSON.stringify({
  email: 'test3@gmail.com',
  username: 'test3',
  fullName: 'test3',
  password: 'password123'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  let body = '';
  res.on('data', d => {
    body += d;
  });
  res.on('end', () => {
    console.log(`Body: '${body}'`);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
