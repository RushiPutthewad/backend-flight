/* Diagnostic: run the register flow directly against MongoDB */
require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  console.log('1. Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('   Connected. ReadyState:', mongoose.connection.readyState);
  console.log('   Database name:', mongoose.connection.name);

  console.log('2. Loading User model...');
  const User = require('./src/models/user.model');
  console.log('   OK');

  console.log('3. Running User.findOne({ email: "diag@example.com" })...');
  const existing = await User.findOne({ email: 'diag@example.com' });
  console.log('   findOne OK, result:', existing);

  console.log('4. Running User.create(...)...');
  const user = await User.create({
    email: 'diag@example.com',
    password: 'TestPassword123',
    firstName: 'Diag',
    lastName: 'Test'
  });
  console.log('   create OK, id:', user._id);

  console.log('5. Calling user.toJSON()...');
  console.log(JSON.stringify(user.toJSON(), null, 2));

  console.log('\nALL STEPS PASSED — the register flow works at the DB level.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('\nFAILED at step — error details:');
  console.error('Name:', err.name);
  console.error('Message:', err.message);
  console.error('Code:', err.code);
  console.error('Stack:', err.stack);
  process.exit(1);
});
