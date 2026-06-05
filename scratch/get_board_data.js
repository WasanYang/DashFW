const { MongoClient, ObjectId } = require('mongodb');
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
      process.env[key] = value.trim();
    }
  });
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const projectId = "6a1d1d67f9f823d16a6cb57d";
    
    // Find project
    let project = null;
    try {
      project = await db.collection('projects').findOne({ _id: new ObjectId(projectId) });
    } catch (e) {
      project = await db.collection('projects').findOne({ _id: projectId });
    }
    
    if (!project) {
      console.log(`Project with ID ${projectId} not found.`);
      return;
    }
    
    console.log("=== PROJECT DETAILS ===");
    console.log(JSON.stringify(project, null, 2));
    
    // Find tasks for this project
    const tasks = await db.collection('tasks').find({ projectId: projectId }).toArray();
    console.log(`\n=== TASKS COUNT for project: ${tasks.length} ===`);
    
    console.log("\n=== ALL TASKS ===");
    console.log(JSON.stringify(tasks, null, 2));
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

run();
