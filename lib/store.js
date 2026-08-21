const fs   = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "../data/appointments.json");

function load() {
  if (!fs.existsSync(DATA_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
  catch { return {}; }
}

function save(data) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  all()              { return load(); },
  add(appt)          { const d = load(); d[appt.id] = appt; save(d); },
  remove(id)         { const d = load(); delete d[id]; save(d); },
  reset()            { save({}); },
};
