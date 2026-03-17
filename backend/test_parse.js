const axios = require('axios');
const xml2js = require('xml2js');
const https = require('https');

const itunesAgent = new https.Agent({ rejectUnauthorized: false });

(async () => {
    const res = await axios.get('https://ax.itunes.apple.com/WebObjects/MZStoreServices.woa/ws/RSS/topsongs/limit=10/xml', { httpsAgent: itunesAgent });
    const parsed = await xml2js.parseStringPromise(res.data, { explicitArray: false, trim: true });
    const entries = parsed.feed.entry;
    console.log("link type:", Array.isArray(entries[0].link) ? "Array" : typeof entries[0].link);
    console.log("link content:", JSON.stringify(entries[0].link, null, 2));
})();
