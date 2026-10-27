require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Broker = require('./src/models/Broker');
const Candidate = require('./src/models/Candidate');
const Match = require('./src/models/Match');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/matrimony-app';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

const seedData = async () => {
  try {
    await Broker.deleteMany();
    await Candidate.deleteMany();
    await Match.deleteMany();

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);

    const broker1 = new Broker({ name: 'Ravi Sharma', email: 'ravi@brokerbond.com', password: hash, agencyName: 'Sharma Matchmakers' });
    const broker2 = new Broker({ name: 'Anjali Verma', email: 'anjali@brokerbond.com', password: hash, agencyName: 'Verma Matrimony' });
    await broker1.save();
    await broker2.save();

    const candidates = [
      { brokerId: broker1._id, name: 'Rahul Gupta', age: 28, gender: 'Male', city: 'Delhi', education: 'B.Tech', incomeRange: '10-15 LPA', familyEmail: 'rahul.family@example.com', isOpenToReferral: true },
      { brokerId: broker1._id, name: 'Neha Singh', age: 26, gender: 'Female', city: 'Delhi', education: 'MBA', incomeRange: '10-15 LPA', familyEmail: 'neha.family@example.com', isOpenToReferral: true },
      { brokerId: broker2._id, name: 'Priya Mishra', age: 27, gender: 'Female', city: 'Mumbai', education: 'B.Tech', incomeRange: '15-20 LPA', familyEmail: 'priya.family@example.com', isOpenToReferral: true },
      { brokerId: broker2._id, name: 'Amit Kumar', age: 29, gender: 'Male', city: 'Delhi', education: 'MBA', incomeRange: '20+ LPA', familyEmail: 'amit.family@example.com', isOpenToReferral: true },
    ];

    const insertedCandidates = await Candidate.insertMany(candidates);

    const match1 = new Match({
      candidate1: insertedCandidates[0]._id,
      candidate2: insertedCandidates[1]._id,
      brokerId: broker1._id,
      stage: 'Meeting Arranged'
    });
    await match1.save();

    console.log('Database seeded successfully!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedData();
