
import mongoose from "mongoose";
const { Schema } = mongoose;
const SubjectSchema = new Schema({
  id: { type: String, unique: true },
  name: String,
  no_of_hours_per_week: Number,
  sem: Number,
  type: { 
    type: String, 
    enum: ["theory", "lab"], 
    required: true 
  }
});
export default mongoose.model('Subject', SubjectSchema);
