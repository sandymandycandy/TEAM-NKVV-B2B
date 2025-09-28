// scripts/inspect-users.js
// Print first 10 users with _id, name, fullName for inspection
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

async function main(){
  try{
    await connectDB();
    const users = await User.find({}).limit(10).select('name fullName email role').lean();
    console.log('Found users:', users.length);
    users.forEach(u=> console.log(u));
    process.exit(0);
  } catch(err){
    console.error(err);
    process.exit(1);
  }
}

main();
