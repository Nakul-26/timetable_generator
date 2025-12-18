import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const { Schema } = mongoose;

const FacultySchema = new Schema({
  id: { type: String }, // Not unique globally anymore
  name: String,
  email: { type: String, unique: true, sparse: true }, // Sparse index allows multiple nulls
  password: { type: String },
  role: { type: String, enum: ['admin', 'faculty'], default: 'faculty' },
  ownerId: { type: Schema.Types.ObjectId, ref: 'Faculty' }
});

FacultySchema.index({ id: 1, ownerId: 1 }, { unique: true, partialFilterExpression: { id: { $type: "string" } } });

// Hash password before saving
FacultySchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
FacultySchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate auth token
FacultySchema.methods.generateAuthToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

export default mongoose.model('Faculty', FacultySchema);
