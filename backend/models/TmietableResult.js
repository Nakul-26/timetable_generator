import mongoose from "mongoose";
const { Schema } = mongoose;
const ResultSchema = new Schema({
  createdAt: { type: Date, default: Date.now },
  class_timetables: Object,
  faculty_timetables: Object,
});
export default mongoose.model('TimetableResult', ResultSchema);
