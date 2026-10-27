require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/matrimony-app';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('Broker-Bond API Running');
});

app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/candidates', require('./src/routes/candidateRoutes'));
app.use('/api/pipeline', require('./src/routes/pipelineRoutes'));
app.use('/api/referrals', require('./src/routes/referralRoutes'));
app.use('/api/interests', require('./src/routes/interestRoutes'));
app.use('/api/activity', require('./src/routes/activityRoutes'));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
