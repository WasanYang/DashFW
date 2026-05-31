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

async function check2() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    console.log('Fetching tasks...');
    const allTasks = await db.collection('tasks').find().toArray();
    console.log('Tasks count:', allTasks.length);
    console.log('Fetching clients...');
    const allClients = await db.collection('clients').find().toArray();
    console.log('Clients count:', allClients.length);
    
    // Check fields of the first task
    if (allTasks.length > 0) {
      console.log('First task fields:', Object.keys(allTasks[0]), 'clientId:', allTasks[0].clientId, 'projectId:', allTasks[0].projectId);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

check2();
