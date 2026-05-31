const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Read dotenv
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

if (!uri || !dbName) {
  console.error('Missing MONGODB_URI or MONGODB_DB in .env.local');
  process.exit(1);
}

async function migrate() {
  console.log('Connecting to client...');
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB database:', dbName);
    const db = client.db(dbName);

    const tasksColl = db.collection('tasks');
    const clientsColl = db.collection('clients');
    const projectsColl = db.collection('projects'); // New projects collection

    console.log('Fetching tasks...');
    const allTasks = await tasksColl.find().toArray();
    console.log(`Fetched ${allTasks.length} tasks.`);

    console.log('Fetching clients...');
    const allClients = await clientsColl.find().toArray();
    console.log(`Fetched ${allClients.length} clients.`);

    const clientMap = new Map();
    for (const c of allClients) {
      clientMap.set(c._id.toString(), c);
    }

    // Extract unique clientIds as strings
    const uniqueClientIds = [];
    const seenClients = new Set();
    for (const t of allTasks) {
      if (t.clientId) {
        const cIdStr = t.clientId.toString();
        if (!seenClients.has(cIdStr)) {
          seenClients.add(cIdStr);
          uniqueClientIds.push(cIdStr);
        }
      }
    }
    console.log('Unique Client IDs as strings:', uniqueClientIds);

    const clientToProjectMap = new Map();

    // Create high-level project for each unique client
    for (const clientIdStr of uniqueClientIds) {
      console.log(`Processing client ID: ${clientIdStr}...`);
      const clientObj = clientMap.get(clientIdStr);
      const clientName = clientObj ? clientObj.name : 'Unknown Client';
      const projectTitle = `Project for ${clientName}`;

      console.log(`Checking if project exists for client: ${clientName}...`);
      // Use query with clientId as either string or ObjectId depending on how it's stored
      let existingProj = await projectsColl.findOne({
        $or: [
          { clientId: clientIdStr },
          { clientId: new ObjectId(clientIdStr) }
        ]
      });

      if (!existingProj) {
        console.log(`Creating high-level project: "${projectTitle}"...`);
        const newProj = {
          title: projectTitle,
          subtitle: 'System Migrated Retainer',
          clientId: clientIdStr, // Store as string for consistency
          details: `Default container project migrated for client ${clientName}.`,
          startDate: new Date(),
          deadline: new Date(),
          gross_price: 0,
          hourlyRate: 0,
          currency: 'USD',
          color: '#3b82f6',
          archived: false,
          billable: true,
          revisions: 0
        };
        const insertRes = await projectsColl.insertOne(newProj);
        clientToProjectMap.set(clientIdStr, insertRes.insertedId.toString());
        console.log(`Created project with ID: ${insertRes.insertedId}`);
      } else {
        clientToProjectMap.set(clientIdStr, existingProj._id.toString());
        console.log(`Found existing project: "${existingProj.title}" (ID: ${existingProj._id})`);
      }
    }

    // Handle tasks without client
    const tasksWithoutClient = allTasks.filter(t => !t.clientId);
    console.log(`Tasks without clientId: ${tasksWithoutClient.length}`);
    if (tasksWithoutClient.length > 0) {
      console.log('Checking if General Projects exists...');
      let existingGeneralProj = await projectsColl.findOne({ title: 'General Projects' });
      let generalProjId;
      if (!existingGeneralProj) {
        console.log('Creating General Projects container...');
        const generalProj = {
          title: 'General Projects',
          clientId: 'general',
          startDate: new Date(),
          deadline: new Date(),
          archived: false,
          color: '#64748b'
        };
        const insertRes = await projectsColl.insertOne(generalProj);
        generalProjId = insertRes.insertedId.toString();
        console.log(`Created General Projects with ID: ${generalProjId}`);
      } else {
        generalProjId = existingGeneralProj._id.toString();
        console.log(`Found existing General Projects (ID: ${generalProjId})`);
      }
      clientToProjectMap.set('general', generalProjId);
    }

    // Update tasks with their parent projectId
    console.log('Linking tasks to parent projects...');
    for (const task of allTasks) {
      const taskClientId = task.clientId;
      const targetProjId = taskClientId ? clientToProjectMap.get(taskClientId.toString()) : clientToProjectMap.get('general');

      if (targetProjId) {
        console.log(`Updating task "${task.title}" with projectId "${targetProjId}"...`);
        const updateRes = await tasksColl.updateOne(
          { _id: task._id },
          { $set: { projectId: targetProjId } }
        );
        console.log(`Task updated (modifiedCount: ${updateRes.modifiedCount})`);
      }
    }
    console.log('Migration completed successfully.');

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    console.log('Closing client...');
    await client.close();
    console.log('Closed.');
  }
}

migrate();
