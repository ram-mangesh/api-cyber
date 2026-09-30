const localtunnel = require('localtunnel');

(async () => {
  try {
    const tunnel = await localtunnel({ port: 5173 });
    console.log(tunnel.url);
  } catch (err) {
    console.error(err);
  }
})();