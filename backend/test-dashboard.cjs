const http = require('http');

const data = JSON.stringify({
  email: "admin@tuitionapp.com",
  password: "password123"
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const json = JSON.parse(body);
    const token = json.data.accessToken;
    
    http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/dashboard/dashboard',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    }, (res2) => {
      let b2 = '';
      res2.on('data', d => b2 += d);
      res2.on('end', () => console.log(b2));
    }).end();
  });
});
req.write(data);
req.end();
