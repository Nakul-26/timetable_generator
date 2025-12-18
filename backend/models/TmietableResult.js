import mongoose from "mongoose";
const { Schema } = mongoose;
const ResultSchema = new Schema({
  createdAt: { type: Date, default: Date.now },
  class_timetables: Object,
  faculty_timetables: Object,
  ownerId: { type: Schema.Types.ObjectId, ref: 'Faculty', required: true }
});
export default mongoose.model('TimetableResult', ResultSchema);
