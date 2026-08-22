const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  id:        { type: String, required: true, unique: true },
  name:      String,
  phone:     String,
  email:     { type: String, default: '' },
  qty:       Number,
  startTime: String,
  endTime:   String,
  price:     Number,
  delivery:  { type: Boolean, default: false },
  address:   { type: String, default: '' },
  collected: { type: Boolean, default: false },
  inspected:  { type: Boolean, default: false },
  returned:   { type: Boolean, default: false },
  paid:       { type: Boolean, default: false },
  cancelled:  { type: Boolean, default: false },
  createdAt: String,
}, { _id: false, versionKey: false });

const Appt = mongoose.model('Appointment', schema);

let ready = false;

async function connect() {
  if (!ready) {
    await mongoose.connect(process.env.MONGODB_URI);
    ready = true;
  }
}

module.exports = {
  async all() {
    await connect();
    const list = await Appt.find({}).lean();
    const out = {};
    for (const a of list) out[a.id] = a;
    return out;
  },
  async add(appt) {
    await connect();
    await Appt.findOneAndUpdate({ id: appt.id }, appt, { upsert: true, new: true });
  },
  async remove(id) {
    await connect();
    await Appt.deleteOne({ id });
  },
  async reset() {
    await connect();
    await Appt.deleteMany({});
  },
};
