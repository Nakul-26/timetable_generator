import mongoose from "mongoose";
const { Schema } = mongoose;
const ClassSchema = new Schema({
  id: { type: String }, // Not unique globally anymore
  sem: Number,
  name: String,
  section: String,
  days_per_week: { type: Number, default: 5 },
  assigned_teacher_subject_combos: [{ type: Schema.Types.ObjectId, ref: 'Combo' }],
  total_class_hours: Number,
  ownerId: { type: Schema.Types.ObjectId, ref: 'Faculty', required: true }
});

// Ensure that the combination of id and ownerId is unique
ClassSchema.index({ id: 1, ownerId: 1 }, { unique: true, partialFilterExpression: { id: { $type: "string" } } });

export default mongoose.model('Class', ClassSchema);
