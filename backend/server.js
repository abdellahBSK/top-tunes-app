const { createApp } = require('./app/createExpressApp');
const { connectDB } = require('./database/mongo');
const { PORT } = require('./config/env');

async function start() {
  await connectDB();
  const app = createApp();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start().catch(err => { console.error(err); process.exit(1); });
