import mongoose from "mongoose";

const { Schema } = mongoose;

const FacultySchema = new Schema({
  id: { type: String }, // Not unique globally anymore
  name: String,
  role: { type: String, enum: ['faculty'], default: 'faculty' },
  ownerId: { type: Schema.Types.ObjectId, ref: 'Faculty' }
});

FacultySchema.index({ id: 1, ownerId: 1 }, { unique: true, partialFilterExpression: { id: { $type: "string" } } });

export default mongoose.model('Faculty', FacultySchema);
