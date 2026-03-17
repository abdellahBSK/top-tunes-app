const axios = require('axios');
const xml2js = require('xml2js');
const https = require('https');

async function test() {
    const itunesAgent = new https.Agent({ rejectUnauthorized: false });
    const response = await axios.get('https://ax.itunes.apple.com/WebObjects/MZStoreServices.woa/ws/RSS/topsongs/limit=10/xml', {
        timeout: 10000,
        httpsAgent: itunesAgent,
    });
    const parsed = await xml2js.parseStringPromise(response.data, {
        explicitArray: false,
        trim: true,
    });
    console.log(JSON.stringify(parsed.feed.entry[0].link, null, 2));
}
test().catch(console.error);
