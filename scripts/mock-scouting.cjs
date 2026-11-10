
const http = require('node:http');

const server = http.createServer((req, res) => {
  const match = req.url?.match(/^\/scouting\/(\d+)$/);

  if (req.method !== 'GET' || !match) {
    res.writeHead(404);
    return res.end('Not found');
  }

  const playerNo = Number(match[1]);

  if (playerNo === 999999) {
    res.writeHead(503);
    return res.end('Scouting unavailable');
  }

  res.writeHead(200, {
    'Content-Type': 'application/json',
  });

  res.end(JSON.stringify({
    playerNo,
    rating: 85,
    recommendation: 'Promising player',
  }));
});

server.listen(4000, () => {
  console.log('Mock Scouting service listening on port 4000');
});
