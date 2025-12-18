import mongoose from "mongoose";
const { Schema } = mongoose;
const SubjectSchema = new Schema({
  id: { type: String }, // Not unique globally anymore
  name: String,
  no_of_hours_per_week: Number,
  sem: Number,
  type: { 
    type: String, 
    enum: ["theory", "lab"], 
    required: true 
  },
  ownerId: { type: Schema.Types.ObjectId, ref: 'Faculty', required: true }
});

// Ensure that the combination of id and ownerId is unique
SubjectSchema.index({ id: 1, ownerId: 1 }, { unique: true, partialFilterExpression: { id: { $type: "string" } } });

export default mongoose.model('Subject', SubjectSchema);
