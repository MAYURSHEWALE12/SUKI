const http = require('http');

const data = JSON.stringify({ heroBanners: [] });

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/homepage',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  res.on('data', d => process.stdout.write(d));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
