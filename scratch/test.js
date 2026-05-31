const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

console.log('URI:', uri);
console.log('DB:', dbName);

async function run() {
  const client = new MongoClient(uri);
  try {
    console.log('Connecting...');
    await client.connect();
    console.log('Connected!');
    const db = client.db(dbName);
    const count = await db.collection('projects').countDocuments();
    console.log('Count:', count);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

run();
