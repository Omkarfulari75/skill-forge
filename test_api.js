const http = require('http');

const data = JSON.stringify({
  student_id: 1,
  course_id: 1,
  topic: "Overall Course Assessment"
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/adaptive-learning',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', body);
    process.exit(res.statusCode === 200 ? 0 : 1);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
  process.exit(1);
});

req.write(data);
req.end();
