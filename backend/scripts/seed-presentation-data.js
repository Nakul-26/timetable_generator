import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';
import Faculty from '../models/Faculty.js';
import Subject from '../models/Subject.js';
import ClassModel from '../models/Class.js';
import Combo from '../models/Combo.js';
import TimetableResult from '../models/TmietableResult.js';

dotenv.config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI is missing");
    await mongoose.connect(uri, {
      dbName: 'test2',
      serverSelectionTimeoutMS: 20000
    });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ Mongoose connection error:', err);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    const demoEmail = 'demo@bmsit.in';
    const demoPassword = 'password123';
    const demoName = 'Demo Admin';

    // 1. Clean up existing demo data
    const existingAdmin = await Admin.findOne({ email: demoEmail });
    if (existingAdmin) {
      console.log('Cleaning up existing demo data for:', demoEmail);
      const ownerId = existingAdmin._id;
      await Promise.all([
        Faculty.deleteMany({ ownerId }),
        Subject.deleteMany({ ownerId }),
        ClassModel.deleteMany({ ownerId }),
        Combo.deleteMany({ ownerId }),
        TimetableResult.deleteMany({ ownerId }),
        Admin.deleteOne({ _id: ownerId })
      ]);
    }

    // 2. Create Admin
    const hashedPassword = await bcrypt.hash(demoPassword, 10);
    const admin = new Admin({
      name: demoName,
      email: demoEmail,
      password: hashedPassword,
      role: 'admin'
    });
    await admin.save();
    const ownerId = admin._id;
    console.log('✅ Demo Admin created:', demoEmail);

    // 3. Create Faculties (16 teachers)
    const faculties = await Faculty.insertMany([
      { name: 'Dr. Smith', id: 'F001', ownerId },
      { name: 'Prof. Johnson', id: 'F002', ownerId },
      { name: 'Dr. Williams', id: 'F003', ownerId },
      { name: 'Ms. Brown', id: 'F004', ownerId },
      { name: 'Dr. Garcia', id: 'F005', ownerId },
      { name: 'Prof. Miller', id: 'F006', ownerId },
      { name: 'Dr. Davis', id: 'F007', ownerId },
      { name: 'Ms. Wilson', id: 'F008', ownerId },
      { name: 'Dr. Taylor', id: 'F009', ownerId },
      { name: 'Prof. Anderson', id: 'F010', ownerId },
      { name: 'Dr. Thomas', id: 'F011', ownerId },
      { name: 'Ms. Moore', id: 'F012', ownerId },
      { name: 'Dr. Jackson', id: 'F013', ownerId },
      { name: 'Prof. White', id: 'F014', ownerId },
      { name: 'Dr. Harris', id: 'F015', ownerId },
      { name: 'Ms. Martin', id: 'F016', ownerId }
    ]);
    console.log('✅ Faculties created (16 teachers)');

    // 4. Create Subjects (Heavier load to fill slots)
    const subjects = await Subject.insertMany([
      // Sem 1
      { name: 'Mathematics I', id: 'MAT101', sem: 1, no_of_hours_per_week: 5, type: 'theory', ownerId },
      { name: 'Physics', id: 'PHY101', sem: 1, no_of_hours_per_week: 4, type: 'theory', ownerId },
      { name: 'Basic Electrical', id: 'ELE101', sem: 1, no_of_hours_per_week: 4, type: 'theory', ownerId },
      { name: 'Programming in C', id: 'CPS101', sem: 1, no_of_hours_per_week: 4, type: 'theory', ownerId },
      { name: 'Engineering Graphics', id: 'EGR101', sem: 1, no_of_hours_per_week: 3, type: 'theory', ownerId },
      { name: 'Constitution of India', id: 'CON101', sem: 1, no_of_hours_per_week: 2, type: 'theory', ownerId },
      { name: 'Technical English', id: 'ENG101', sem: 1, no_of_hours_per_week: 2, type: 'theory', ownerId },
      { name: 'Env Science', id: 'ENV101', sem: 1, no_of_hours_per_week: 2, type: 'theory', ownerId },
      { name: 'Life Skills', id: 'LS101', sem: 1, no_of_hours_per_week: 2, type: 'theory', ownerId },
      { name: 'Physics Lab', id: 'PHY101L', sem: 1, no_of_hours_per_week: 3, type: 'lab', ownerId },
      { name: 'C Programming Lab', id: 'CPS101L', sem: 1, no_of_hours_per_week: 3, type: 'lab', ownerId },

      // Sem 3
      { name: 'Mathematics III', id: 'MAT301', sem: 3, no_of_hours_per_week: 5, type: 'theory', ownerId },
      { name: 'Data Structures', id: 'CS301', sem: 3, no_of_hours_per_week: 5, type: 'theory', ownerId },
      { name: 'Analog & Digital Electronics', id: 'CS302', sem: 3, no_of_hours_per_week: 4, type: 'theory', ownerId },
      { name: 'Computer Organization', id: 'CS303', sem: 3, no_of_hours_per_week: 4, type: 'theory', ownerId },
      { name: 'Software Engineering', id: 'CS304', sem: 3, no_of_hours_per_week: 3, type: 'theory', ownerId },
      { name: 'Discrete Math', id: 'CS305', sem: 3, no_of_hours_per_week: 3, type: 'theory', ownerId },
      { name: 'Unix Shell Prog', id: 'CS306', sem: 3, no_of_hours_per_week: 2, type: 'theory', ownerId },
      { name: 'Object Oriented Prog', id: 'CS307', sem: 3, no_of_hours_per_week: 3, type: 'theory', ownerId },
      { name: 'DS Lab', id: 'CS301L', sem: 3, no_of_hours_per_week: 3, type: 'lab', ownerId },
      { name: 'ADE Lab', id: 'CS302L', sem: 3, no_of_hours_per_week: 3, type: 'lab', ownerId }
    ]);
    console.log('✅ Subjects created (20 subjects)');

    // 5. Create Classes
    const classes = await ClassModel.insertMany([
      { name: 'CSE 1st Sem A', id: 'C1', sem: 1, section: 'A', days_per_week: 5, ownerId, total_class_hours: 0 },
      { name: 'CSE 1st Sem B', id: 'C2', sem: 1, section: 'B', days_per_week: 5, ownerId, total_class_hours: 0 },
      { name: 'CSE 3rd Sem A', id: 'C3', sem: 3, section: 'A', days_per_week: 5, ownerId, total_class_hours: 0 }
    ]);
    console.log('✅ Classes created');

    // 6. Create Combos and Assign to Classes
    const combos = [];
    
    // Assigning to C1 (Sem 1 A)
    combos.push(
      { faculty_id: faculties[0]._id, subject_id: subjects[0]._id, class_id: classes[0]._id, combo_name: 'Smith - Math I', ownerId },
      { faculty_id: faculties[1]._id, subject_id: subjects[1]._id, class_id: classes[0]._id, combo_name: 'Johnson - Physics', ownerId },
      { faculty_id: faculties[2]._id, subject_id: subjects[2]._id, class_id: classes[0]._id, combo_name: 'Williams - Basic Elec', ownerId },
      { faculty_id: faculties[3]._id, subject_id: subjects[3]._id, class_id: classes[0]._id, combo_name: 'Brown - C Prog', ownerId },
      { faculty_id: faculties[4]._id, subject_id: subjects[4]._id, class_id: classes[0]._id, combo_name: 'Garcia - Eng Graph', ownerId },
      { faculty_id: faculties[5]._id, subject_id: subjects[5]._id, class_id: classes[0]._id, combo_name: 'Miller - Const India', ownerId },
      { faculty_id: faculties[6]._id, subject_id: subjects[6]._id, class_id: classes[0]._id, combo_name: 'Davis - English', ownerId },
      { faculty_id: faculties[7]._id, subject_id: subjects[7]._id, class_id: classes[0]._id, combo_name: 'Wilson - Env Sci', ownerId },
      { faculty_id: faculties[8]._id, subject_id: subjects[8]._id, class_id: classes[0]._id, combo_name: 'Taylor - Life Skills', ownerId },
      { faculty_id: faculties[9]._id, subject_id: subjects[9]._id, class_id: classes[0]._id, combo_name: 'Anderson - Physics Lab', ownerId },
      { faculty_id: faculties[10]._id, subject_id: subjects[10]._id, class_id: classes[0]._id, combo_name: 'Thomas - C Lab', ownerId }
    );

    // Assigning to C2 (Sem 1 B)
    combos.push(
      { faculty_id: faculties[11]._id, subject_id: subjects[0]._id, class_id: classes[1]._id, combo_name: 'Moore - Math I', ownerId },
      { faculty_id: faculties[12]._id, subject_id: subjects[1]._id, class_id: classes[1]._id, combo_name: 'Jackson - Physics', ownerId },
      { faculty_id: faculties[13]._id, subject_id: subjects[2]._id, class_id: classes[1]._id, combo_name: 'White - Basic Elec', ownerId },
      { faculty_id: faculties[14]._id, subject_id: subjects[3]._id, class_id: classes[1]._id, combo_name: 'Harris - C Prog', ownerId },
      { faculty_id: faculties[15]._id, subject_id: subjects[4]._id, class_id: classes[1]._id, combo_name: 'Martin - Eng Graph', ownerId },
      { faculty_id: faculties[0]._id, subject_id: subjects[5]._id, class_id: classes[1]._id, combo_name: 'Smith - Const India', ownerId },
      { faculty_id: faculties[1]._id, subject_id: subjects[6]._id, class_id: classes[1]._id, combo_name: 'Johnson - English', ownerId },
      { faculty_id: faculties[2]._id, subject_id: subjects[7]._id, class_id: classes[1]._id, combo_name: 'Williams - Env Sci', ownerId },
      { faculty_id: faculties[3]._id, subject_id: subjects[8]._id, class_id: classes[1]._id, combo_name: 'Brown - Life Skills', ownerId },
      { faculty_id: faculties[4]._id, subject_id: subjects[9]._id, class_id: classes[1]._id, combo_name: 'Garcia - Physics Lab', ownerId },
      { faculty_id: faculties[5]._id, subject_id: subjects[10]._id, class_id: classes[1]._id, combo_name: 'Miller - C Lab', ownerId }
    );

    // Assigning to C3 (Sem 3 A)
    combos.push(
      { faculty_id: faculties[6]._id, subject_id: subjects[11]._id, class_id: classes[2]._id, combo_name: 'Davis - Math III', ownerId },
      { faculty_id: faculties[7]._id, subject_id: subjects[12]._id, class_id: classes[2]._id, combo_name: 'Wilson - DS', ownerId },
      { faculty_id: faculties[8]._id, subject_id: subjects[13]._id, class_id: classes[2]._id, combo_name: 'Taylor - ADE', ownerId },
      { faculty_id: faculties[9]._id, subject_id: subjects[14]._id, class_id: classes[2]._id, combo_name: 'Anderson - Comp Org', ownerId },
      { faculty_id: faculties[10]._id, subject_id: subjects[15]._id, class_id: classes[2]._id, combo_name: 'Thomas - Soft Eng', ownerId },
      { faculty_id: faculties[11]._id, subject_id: subjects[16]._id, class_id: classes[2]._id, combo_name: 'Moore - Discrete Math', ownerId },
      { faculty_id: faculties[12]._id, subject_id: subjects[17]._id, class_id: classes[2]._id, combo_name: 'Jackson - Unix Prog', ownerId },
      { faculty_id: faculties[13]._id, subject_id: subjects[18]._id, class_id: classes[2]._id, combo_name: 'White - OOP', ownerId },
      { faculty_id: faculties[14]._id, subject_id: subjects[19]._id, class_id: classes[2]._id, combo_name: 'Harris - DS Lab', ownerId },
      { faculty_id: faculties[15]._id, subject_id: subjects[19]._id, class_id: classes[2]._id, combo_name: 'Martin - ADE Lab', ownerId }
    );

    const createdCombos = await Combo.insertMany(combos);
    console.log('✅ Combos created (32 combos)');

    // Link combos to classes and set total hours
    const c1Combos = createdCombos.filter(c => c.class_id.toString() === classes[0]._id.toString());
    await ClassModel.updateOne(
      { _id: classes[0]._id },
      { 
        $push: { assigned_teacher_subject_combos: { $each: c1Combos.map(c => c._id) } },
        $set: { total_class_hours: 34 } // 5+4+4+4+3+2+2+2+2+3+3
      }
    );

    const c2Combos = createdCombos.filter(c => c.class_id.toString() === classes[1]._id.toString());
    await ClassModel.updateOne(
      { _id: classes[1]._id },
      { 
        $push: { assigned_teacher_subject_combos: { $each: c2Combos.map(c => c._id) } },
        $set: { total_class_hours: 34 } 
      }
    );

    const c3Combos = createdCombos.filter(c => c.class_id.toString() === classes[2]._id.toString());
    await ClassModel.updateOne(
      { _id: classes[2]._id },
      { 
        $push: { assigned_teacher_subject_combos: { $each: c3Combos.map(c => c._id) } },
        $set: { total_class_hours: 35 } // 5+5+4+4+4+3+3+3+3+1
      }
    );
    console.log('✅ Combos linked to classes');

    console.log('\n🚀 SEEDING COMPLETE!');
    console.log('-------------------');
    console.log('Email:    demo@bmsit.in');
    console.log('Password: password123');
    console.log('-------------------');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedData();
