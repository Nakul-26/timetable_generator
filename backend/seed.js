import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Admin from './models/Admin.js'; // Changed from Faculty to Admin

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'test2',
      serverSelectionTimeoutMS: 20000
    });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ Mongoose connection error:', err);
    process.exit(1);
  }
};

const createAdmin = async () => {
  try {
    await connectDB();

    const email = 'bmsit0@bmsit.in';
    const password = '';
    const name = 'Admin';

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log('Admin user already exists');
      mongoose.connection.close();
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({
      name,
      email,
      password: hashedPassword,
    });

    try {
      await admin.save();
      console.log('Admin user created successfully');
    } catch (error) {
      console.error('Error creating admin user:', error.message);
    } finally {
      mongoose.connection.close();
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

createAdmin();
