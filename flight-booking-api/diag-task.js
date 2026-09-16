/* Diagnostic: trace the real error in task creation */
require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  console.log('Connecting...');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('Connected to DB:', mongoose.connection.name);

  const User = require('./src/models/user.model');
  const Task = require('./src/models/task.model');

  // Create a test user first
  const email = 'diagtask' + Date.now() + '@example.com';
  const user = await User.create({ email, password: 'TestPass123', firstName: 'T', lastName: 'T' });
  console.log('User created:', user._id);

  console.log('\n--- Attempting Task.create ---');
  const payload = {
    user: user._id,
    title: 'Valid task',
    category: 'travel',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-10-20'  // check if this string causes cast error
  };
  console.log('Payload:', JSON.stringify(payload));

  const task = await Task.create(payload);
  console.log('Task created OK:', task._id);

  console.log('\n--- Attempting Task.countDocuments (like stats) ---');
  const stats = await Task.aggregate([
    { $match: { user: user._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  console.log('Stats OK:', stats);

  // Now test with string userId (like the service receives)
  console.log('\n--- Testing with STRING userId (service layer style) ---');
  const stringId = user._id.toString();
  const stats2 = await Task.aggregate([
    { $match: { user: stringId } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  console.log('Stats with string userId:', stats2);

  await mongoose.disconnect();
  console.log('\nALL STEPS PASSED');
}

main().catch((err) => {
  console.error('\nFAILED:');
  console.error('Name:', err.name);
  console.error('Message:', err.message);
  console.error('Code:', err.code);
  console.error('Stack:', err.stack);
  process.exit(1);
});
