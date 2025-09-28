// scripts/fill-fullname.js
// One-time script to copy `name` -> `fullName` for users where fullName is empty

const mongoose = require('mongoose');
require('dotenv').config();

// Load DB config function and models
const connectDB = require('../config/db');
const User = require('../models/User');

async function main(){
  try{
    await connectDB();
    console.log('Connected to DB');

    // Update users where fullName is missing or empty
    const res = await User.updateMany(
      { $or: [ { fullName: { $exists: false } }, { fullName: '' } ] },
      [ { $set: { fullName: "$name" } } ]
    );

    console.log(`Matched: ${res.matchedCount}, Modified: ${res.modifiedCount}`);
    process.exit(0);
  }catch(err){
    console.error('Failed:', err);
    process.exit(1);
  }
}

main();
