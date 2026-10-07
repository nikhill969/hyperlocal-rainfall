const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const paths = {
  users: path.join(DATA_DIR, 'users.json'),
  reports: path.join(DATA_DIR, 'reports.json'),
  locations: path.join(DATA_DIR, 'locations.json')
};

const locations = [
  { id: 'solapur', name: 'Solapur', latitude: 17.6599, longitude: 75.9067 },
  { id: 'pune', name: 'Pune', latitude: 18.5204, longitude: 73.8567 },
  { id: 'mumbai', name: 'Mumbai', latitude: 19.076, longitude: 72.8777 },
  { id: 'akkalkot', name: 'Akkalkot', latitude: 17.5256, longitude: 76.2045 },
  { id: 'pandharpur', name: 'Pandharpur', latitude: 17.6778, longitude: 75.3283 }
];

function writeJson(filePath, value) {
  const temporaryPath = `${filePath}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(value, null, 2), 'utf8');
  fs.renameSync(temporaryPath, filePath);
}

function initialize() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(paths.users)) writeJson(paths.users, []);
  if (!fs.existsSync(paths.reports)) writeJson(paths.reports, []);
  if (!fs.existsSync(paths.locations)) writeJson(paths.locations, locations);
}

function read(collection) {
  return JSON.parse(fs.readFileSync(paths[collection], 'utf8'));
}

function write(collection, value) {
  writeJson(paths[collection], value);
}

initialize();

module.exports = { read, write, locations };