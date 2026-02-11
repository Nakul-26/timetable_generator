import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "../models/Admin.js";
import Faculty from "../models/Faculty.js";

dotenv.config();

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not defined in environment variables.");
  }

  await mongoose.connect(uri, {
    dbName: "test2",
    serverSelectionTimeoutMS: 20000,
  });
}

function toPlainUser(doc, source) {
  return {
    source,
    id: String(doc._id),
    name: doc.name || "",
    email: doc.email || "",
    password: doc.password || "",
    role: doc.role || (source === "admins" ? "admin" : "faculty"),
    ownerId: doc.ownerId ? String(doc.ownerId) : "",
  };
}

async function listUsers() {
  await connectDB();

  const [admins, faculties] = await Promise.all([
    Admin.find({}).lean(),
    Faculty.find({}).lean(),
  ]);

  const users = [
    ...admins.map((a) => toPlainUser(a, "admins")),
    ...faculties.map((f) => toPlainUser(f, "faculties")),
  ];

  if (users.length === 0) {
    console.log("No users found.");
    return;
  }

  console.log(`Found ${users.length} users`);
  console.table(users);
}

listUsers()
  .catch((error) => {
    console.error("Failed to list users:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
