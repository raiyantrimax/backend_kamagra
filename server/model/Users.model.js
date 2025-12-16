const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  email:    { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  phone:    { type: String, trim: true }, // added phone field
  password: { type: String, required: true },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },
  active:   { type: Boolean, default: true }
}, { timestamps: true });

// hash password before save if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const hash = await bcrypt.hash(this.password, SALT_ROUNDS);
    this.password = hash;
    next();
  } catch (err) {
    next(err);
  }
});

// instance method to compare password
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);