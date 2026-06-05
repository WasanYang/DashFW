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
    
    console.log("Fetching all tasks...");
    const tasks = await db.collection('tasks').find().toArray();
    console.log(`Found ${tasks.length} task groups in the database.`);
    
    let migrateCount = 0;
    let keepCount = 0;
    
    for (const task of tasks) {
      if (task.subTasks && task.subTasks.length > 0) {
        console.log(`Migrating task group: "${task.title}" (ID: ${task._id}) with ${task.subTasks.length} subtasks.`);
        
        let order = 0;
        for (const sub of task.subTasks) {
          const newTask = {
            title: sub.text,
            details: sub.description || '',
            projectId: task.projectId,
            clientId: task.clientId,
            status: sub.completed ? 'Completed' : 'Backlog',
            gross_price: 0,
            deadline: sub.dueDate ? new Date(sub.dueDate) : (task.deadline ? new Date(task.deadline) : new Date()),
            startDate: sub.startDate ? new Date(sub.startDate) : undefined,
            repeats: sub.repeats || '',
            assignee: sub.assignee || '',
            revisions: 0,
            boardView: task.boardView || 'Main View',
            order: order++
          };
          
          await db.collection('tasks').insertOne(newTask);
        }
        
        // Delete the parent task group
        await db.collection('tasks').deleteOne({ _id: task._id });
        migrateCount++;
      } else {
        // If a task doesn't have subtasks, keep it as is but ensure order field is present if needed
        if (task.order === undefined) {
          await db.collection('tasks').updateOne({ _id: task._id }, { $set: { order: 0 } });
        }
        keepCount++;
      }
    }
    
    console.log(`\nMigration completed:`);
    console.log(`- Migrated and deleted ${migrateCount} task groups.`);
    console.log(`- Kept ${keepCount} existing flat tasks.`);
    
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    await client.close();
  }
}

run();
