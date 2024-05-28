const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;
const DATA_FILE = path.join(__dirname, 'user_data.json');

app.use(bodyParser.json());
app.use(cors()); // Enable all CORS requests

// Ensure the data file exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}

// Helper function to calculate updated energy
const calculateEnergy = (lastUpdate, currentEnergy) => {
  const now = Date.now();
  const secondsElapsed = Math.floor((now - lastUpdate) / 1000);
  return Math.min(currentEnergy + secondsElapsed, 100);
};

// Endpoint to connect user
app.post('/connect/:principalId', (req, res) => {
  const principalId = req.params.principalId;
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

  if (!data[principalId]) {
    data[principalId] = { points: 0, energy: 100, lastUpdate: Date.now() };
  } else {
    const userData = data[principalId];
    userData.energy = calculateEnergy(userData.lastUpdate, userData.energy);
    userData.lastUpdate = Date.now();
    data[principalId] = userData;
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(data));
  res.json(data[principalId]);
});

// Endpoint to load user data
app.get('/user/:principalId', (req, res) => {
  const principalId = req.params.principalId;
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

  if (data[principalId]) {
    const userData = data[principalId];
    userData.energy = calculateEnergy(userData.lastUpdate, userData.energy);
    userData.lastUpdate = Date.now();
    data[principalId] = userData;
    fs.writeFileSync(DATA_FILE, JSON.stringify(data));
    res.json(data[principalId]);
  } else {
    res.status(404).send('User data not found');
  }
});

// Endpoint to save user data
app.post('/user/:principalId', (req, res) => {
  const principalId = req.params.principalId;
  const userData = req.body;
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

  userData.lastUpdate = Date.now();
  data[principalId] = userData;
  fs.writeFileSync(DATA_FILE, JSON.stringify(data));

  res.json(userData);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
