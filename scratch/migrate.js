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
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB database:', dbName);
    const db = client.db(dbName);

    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Current collections:', collectionNames);

    // 1. Rename 'projects' to 'tasks' if 'projects' exists and 'tasks' does not
    if (collectionNames.includes('projects') && !collectionNames.includes('tasks')) {
      console.log("Renaming collection 'projects' to 'tasks' via copy-and-drop...");
      const projectsData = await db.collection('projects').find().toArray();
      if (projectsData.length > 0) {
        await db.collection('tasks').insertMany(projectsData);
      } else {
        // Create an empty tasks collection by inserting and deleting a dummy doc
        const dummy = await db.collection('tasks').insertOne({ dummy: true });
        await db.collection('tasks').deleteOne({ _id: dummy.insertedId });
      }
      await db.collection('projects').drop();
      console.log("Renamed 'projects' to 'tasks'.");
    } else {
      console.log("'projects' to 'tasks' rename skipped (either 'projects' is missing or 'tasks' already exists).");
    }

    // Connect to tasks and clients collections
    const tasksColl = db.collection('tasks');
    const clientsColl = db.collection('clients');
    const projectsColl = db.collection('projects'); // New projects container collection

    // 2. Fetch all tasks to perform migration
    const allTasks = await tasksColl.find().toArray();
    console.log(`Found ${allTasks.length} tasks in the database.`);

    // Find unique clientIds in tasks
    const uniqueClientIds = [...new Set(allTasks.map(t => t.clientId).filter(Boolean))];
    console.log('Unique Client IDs found in tasks:', uniqueClientIds);

    // Fetch all clients for naming projects
    const allClients = await clientsColl.find().toArray();
    const clientMap = new Map(allClients.map(c => [c._id.toString(), c]));

    // Map to keep track of created projectId for each clientId
    const clientToProjectMap = new Map();

    // Create high-level projects for each unique client
    for (const clientId of uniqueClientIds) {
      const clientObj = clientMap.get(clientId);
      const clientName = clientObj ? clientObj.name : 'Unknown Client';
      const projectTitle = `Project for ${clientName}`;

      // Check if project already exists for this client to avoid duplicates
      let existingProj = await projectsColl.findOne({ clientId: clientId });
      if (!existingProj) {
        console.log(`Creating high-level project "${projectTitle}" for client ${clientId}...`);
        const newProj = {
          title: projectTitle,
          subtitle: 'System Migrated Retainer',
          clientId: clientId,
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
        clientToProjectMap.set(clientId, insertRes.insertedId.toString());
        console.log(`Created project with ID: ${insertRes.insertedId}`);
      } else {
        clientToProjectMap.set(clientId, existingProj._id.toString());
        console.log(`Found existing project "${existingProj.title}" for client ${clientId}.`);
      }
    }

    // Handle tasks without client
    const tasksWithoutClient = allTasks.filter(t => !t.clientId);
    if (tasksWithoutClient.length > 0) {
      let existingGeneralProj = await projectsColl.findOne({ title: 'General Projects' });
      let generalProjId;
      if (!existingGeneralProj) {
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
      } else {
        generalProjId = existingGeneralProj._id.toString();
      }
      clientToProjectMap.set('general', generalProjId);
    }

    // 3. Update tasks with their parent projectId
    console.log('Linking tasks to parent projects...');
    for (const task of allTasks) {
      const taskClientId = task.clientId;
      const targetProjId = taskClientId ? clientToProjectMap.get(taskClientId) : clientToProjectMap.get('general');

      if (targetProjId) {
        await tasksColl.updateOne(
          { _id: task._id },
          { $set: { projectId: targetProjId } }
        );
      }
    }
    console.log('Migration completed successfully.');

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.close();
  }
}

migrate();
