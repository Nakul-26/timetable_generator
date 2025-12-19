import { Router } from 'express';
import Faculty from '../Faculty.js';
import Subject from '../Subject.js';
import ClassModel from '../Class.js';
import Combo from '../Combo.js';
import TimetableResult from '../TmietableResult.js';
import generator from '../lib/generator.js';
import runGenerate from '../lib/runGenerator.js';
import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import auth from '../../middleware/auth.js';
import rateLimit from 'express-rate-limit'; // Import rateLimit
import Admin from '../Admin.js'; // Import Admin model

const router = Router();
const protectedRouter = Router();

protectedRouter.use(auth);

// --- Rate Limiter for login ---
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 5 login requests per windowMs
  message:
    "Too many login attempts from this IP, please try again after 15 minutes",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// --- User Authentication ---


router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Try to find user as Admin
        let user = await Admin.findOne({ email });
        console.log("Login attempt for email:", email);

        if (user) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Invalid credentials 1' });
            }
        } else {
            // If not found as Admin, try to find as Faculty
            user = await Faculty.findOne({ email });
            if (!user) {
                return res.status(400).json({ success: false, message: 'Invalid credentials 2' });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Invalid credentials 3' });
            }
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' });
        res.json({ success: true, user: user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('token').json({ success: true });
});

protectedRouter.get('/me', (req, res) => {
    res.json(req.user);
});

// Add Admin
protectedRouter.post('/admins', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if the authenticated user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Only administrators can create new admins.' });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({ name, email, password: hashedPassword, role: 'admin' });
    await admin.save();
    res.status(201).json({ message: 'Admin created successfully', admin });
  } catch (error) {
    res.status(400).json({ error: 'Bad Request', details: error.message });
  }
});

// --- Faculties CRUD ---
//add faculties (teachers)
protectedRouter.post('/faculties', async (req, res) => {
  console.log("[POST /faculties] Body:", req.body);
  try {
    const f = new Faculty({
      ...req.body,
      ownerId: req.user._id
    });
    await f.save();
    console.log("[POST /faculties] Saved faculty:", f);
    res.json(f);
  } catch (e) {
    if (e.code === 11000) {
      return res.status(400).json({ error: 'A faculty with this ID already exists for you.' });
    }
    res.status(400).json({ error: 'Bad Request' });
  }
});

//get all faculties for the current user (teachers they created + themselves)
protectedRouter.get('/faculties', async (req, res) => {
  console.log("[GET /faculties] Fetching all faculties for user:", req.user._id);
  try {
    const faculties = await Faculty.find({
      $or: [{ ownerId: req.user._id }, { _id: req.user._id }]
    }).lean();
    console.log("[GET /faculties] Found:", faculties.length, "records");
    res.json(faculties);
  } catch (e) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update an existing faculty (teacher)
protectedRouter.put('/faculties/:id', async (req, res) => {
  console.log("[PUT /faculties/:id] Params:", req.params, "Body:", req.body);
  try {
    const { id } = req.params;
    const { name, id: facultyId } = req.body;
    const updateData = { name, id: facultyId };

    const updatedFaculty = await Faculty.findOneAndUpdate(
      { _id: id, ownerId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!updatedFaculty) {
      console.warn("[PUT /faculties/:id] Faculty not found for _id:", id);
      return res.status(404).json({ error: 'Faculty not found or you do not have permission to edit it.' });
    }
    console.log("[PUT /faculties/:id] Updated faculty:", updatedFaculty);
    res.json(updatedFaculty);
  } catch (e) {
    res.status(400).json({ error: 'Bad Request' });
  }
});

// Delete a faculty (teacher)
protectedRouter.delete('/faculties/:id', async (req, res) => {
  console.log("[DELETE /faculties/:id] Params:", req.params);
  try {
    const { id } = req.params;
    const deletedFaculty = await Faculty.findOneAndDelete({ _id: id, ownerId: req.user._id });
    if (!deletedFaculty) {
      console.warn("[DELETE /faculties/:id] Faculty not found:", id);
      return res.status(404).json({ error: 'Faculty not found or you do not have permission to delete it.' });
    }

    const deletedCombos = await Combo.deleteMany({ faculty_id: id, ownerId: req.user._id });
    console.log(
      `[DELETE /faculties/:id] Deleted ${deletedCombos.deletedCount} combos linked to faculty ${id} for user ${req.user._id}`
    );

    console.log("[DELETE /faculties/:id] Deleted faculty:", deletedFaculty);
    res.json({ message: 'Faculty deleted successfully.' });
  } catch (e) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Subjects CRUD ---
// Add a subject
protectedRouter.post('/subjects', async (req, res) => {
  console.log("[POST /subjects] Body:", req.body);
  try {
    const s = new Subject({
      ...req.body,
      ownerId: req.user._id
    });

    await s.save();
    console.log("[POST /subjects] Saved subject:", s);
    res.json(s);
  } catch (e) {
    res.status(400).json({ error: 'Bad Request' });
  }
});

// Get all subjects for the current user
protectedRouter.get('/subjects', async (req, res) => {
  console.log("[GET /subjects] Fetching all subjects for user:", req.user._id);
  try {
    const subjects = await Subject.find({ ownerId: req.user._id }).lean();
    console.log("[GET /subjects] Found:", subjects.length, "records");
    res.json(subjects);
  } catch (e) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Edit a subject
protectedRouter.put('/subjects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, no_of_hours_per_week, sem, type } = req.body;

    const updatedSubject = await Subject.findOneAndUpdate(
      { _id: id, ownerId: req.user._id },
      { name, no_of_hours_per_week, sem, type }, // ✅ include type
      { new: true, runValidators: true }
    );

    if (!updatedSubject) {
      return res.status(404).json({ error: "Subject not found or you don't have permission to edit it." });
    }
    res.json(updatedSubject);
  } catch (e) {
    res.status(400).json({ error: 'Bad Request' });
  }
});

// Delete a subject
protectedRouter.delete('/subjects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSubject = await Subject.findOneAndDelete({ _id: id, ownerId: req.user._id });
    if (!deletedSubject) {
      return res.status(404).json({ error: "Subject not found or you don't have permission to delete it." });
    }

    // Also delete combos that use this subject for this user
    const deletedCombos = await Combo.deleteMany({ subject_id: id, ownerId: req.user._id });
    console.log(
      `[DELETE /subjects/:id] Deleted ${deletedCombos.deletedCount} combos linked to subject ${id} for user ${req.user._id}`
    );

    res.json({ message: "Subject deleted successfully." });
  } catch (e) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
  

// --- Classes CRUD ---
//add classes
protectedRouter.post('/classes', async (req, res) => {
  console.log("[POST /classes] Body:", req.body);
  try {
    const c = new ClassModel({
      ...req.body,
      assigned_teacher_subject_combos: req.body.assigned_teacher_subject_combos || [],
      total_class_hours: req.body.total_class_hours || 0,
      ownerId: req.user._id
    });
    await c.save();
    console.log("[POST /classes] Saved class:", c);
    res.json(c);
  } catch (e) {
    if (e.code === 11000) {
      return res.status(400).json({ error: 'A class with this ID already exists.' });
    }
    res.status(400).json({ error: 'Bad Request' });
  }
});

//get all classes for the current user
protectedRouter.get('/classes', async (req, res) => {
  console.log("[GET /classes] Fetching all classes for user:", req.user._id);
  try {
    const classes = await ClassModel.find({ ownerId: req.user._id }).lean();
    console.log("[GET /classes] Found:", classes.length, "records");
    res.json(classes);
  } catch (e) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Edit a class
protectedRouter.put('/classes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sem, section } = req.body;
    const updateData = { name, sem, section };

    const updatedClass = await ClassModel.findOneAndUpdate(
      { _id: id, ownerId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!updatedClass) {
      return res.status(404).json({ error: 'Class not found or you do not have permission to edit it.' });
    }
    res.json(updatedClass);
  } catch (e) {
    res.status(400).json({ error: 'Bad Request' });
  }
});

// Delete a class
protectedRouter.delete('/classes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedClass = await ClassModel.findOneAndDelete({ _id: id, ownerId: req.user._id });
    if (!deletedClass) {
      return res.status(404).json({ error: 'Class not found or you do not have permission to delete it.' });
    }

    const deletedCombos = await Combo.deleteMany({ class_id: id, ownerId: req.user._id });
    console.log(
      `[DELETE /classes/:id] Deleted ${deletedCombos.deletedCount} combos linked to class ${id} for user ${req.user._id}`
    );

    res.json({ message: 'Class deleted successfully.' });
  } catch (e) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Combos ---

protectedRouter.post("/add-and-assign-combo", async (req, res) => {
  console.log("[POST /add-and-assign-combo] Body:", req.body);

  try {
    const { faculty_id, subject_id, combo_name, class_id } = req.body;
    const ownerId = req.user._id;

    // Validate required fields
    if (!faculty_id || !subject_id || !combo_name || !class_id) {
      console.warn("[POST /add-and-assign-combo] Missing required fields");
      return res.status(400).json({
        error: "faculty_id, subject_id, combo_name, and class_id are required."
      });
    }

    // Cross-entity ownership validation
    const subject = await Subject.findOne({ _id: subject_id, ownerId });
    const classModel = await ClassModel.findOne({ _id: class_id, ownerId });

    if (!subject || !classModel) {
      return res.status(403).json({ error: "Access denied. You do not own the subject or class." });
    }

    // Create combo with class_id
    const combo = new Combo({ faculty_id, subject_id, combo_name, class_id, ownerId });
    await combo.save();
    console.log("[POST /add-and-assign-combo] Saved combo:", combo);

    // Assign combo to the class
    await ClassModel.updateOne(
      { _id: class_id, ownerId },
      { $addToSet: { assigned_teacher_subject_combos: combo._id } }
    );

    // Fetch updated class for response
    const updatedClass = await ClassModel.findById(class_id).lean();

    res.json({ combo, assignedTo: updatedClass });
  } catch (e) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get all combos for the current user
protectedRouter.get('/create-and-assign-combos', async (req, res) => {
  try {
    const combos = await Combo.find({ ownerId: req.user._id }).lean();
    res.json(combos);
  } catch (e) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//update a combo and reassign it to a different class if needed
protectedRouter.put('/create-and-assign-combos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { faculty_id, subject_id, combo_name, class_id } = req.body;
    const ownerId = req.user._id;

    // Find existing combo and check ownership
    const existingCombo = await Combo.findOne({ _id: id, ownerId });
    if (!existingCombo) {
      return res.status(404).json({ error: 'Combo not found or you do not have permission to edit it.' });
    }

    // Validate subject & class semester match and ownership
    if (subject_id && class_id) {
      const [subject, classData] = await Promise.all([
        Subject.findOne({ _id: subject_id, ownerId }).lean(),
        ClassModel.findOne({ _id: class_id, ownerId }).lean()
      ]);

      if (!subject || !classData) {
        return res.status(403).json({ error: 'Access denied. You do not own the subject or class.' });
      }

      if (subject.sem !== classData.sem) {
        return res.status(400).json({ 
          error: `Subject semester (${subject.sem}) does not match Class semester (${classData.sem}).` 
        });
      }
    }

    // Unassign from old class if class_id changed
    if (existingCombo.class_id && existingCombo.class_id.toString() !== class_id) {
      await ClassModel.updateOne(
        { _id: existingCombo.class_id, ownerId },
        { $pull: { assigned_teacher_subject_combos: existingCombo._id } }
      );
    }

    // Update combo
    existingCombo.faculty_id = faculty_id;
    existingCombo.subject_id = subject_id;
    existingCombo.combo_name = combo_name;
    existingCombo.class_id = class_id;
    await existingCombo.save();

    // Assign to the new class
    if (class_id) {
      await ClassModel.updateOne(
        { _id: class_id, ownerId },
        { $addToSet: { assigned_teacher_subject_combos: existingCombo._id } }
      );
    }

    // Populate updated combo for response
    const updatedCombo = await Combo.findById(id)
      .populate('faculty_id')
      .populate('subject_id')
      .populate('class_id')
      .lean();

    res.json(updatedCombo);
  } catch (e) {
    res.status(400).json({ error: 'Bad Request' });
  }
});



// Delete a combo and unassign it from its class
protectedRouter.delete('/create-and-assign-combos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user._id;

    const deletedCombo = await Combo.findOneAndDelete({ _id: id, ownerId });
    if (!deletedCombo) {
      return res.status(404).json({ error: 'Combo not found or you do not have permission to delete it.' });
    }

    // Unassign from the class
    if (deletedCombo.class_id) {
      await ClassModel.updateOne(
        { _id: deletedCombo.class_id, ownerId },
        { $pull: { assigned_teacher_subject_combos: deletedCombo._id } }
      );
    }

    res.json({ message: 'Combo deleted and unassigned from class successfully.' });
  } catch (e) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Timetable ---
protectedRouter.post('/generate', async (req, res) => {
  console.log("[POST /generate] Generating timetable for user:", req.user._id);
  try {
    const ownerId = req.user._id;
    const faculties = await Faculty.find({ ownerId }).lean();
    const subjects = await Subject.find({ ownerId }).lean();
    const classes = await ClassModel.find({ ownerId }).lean();
    const combos = await Combo.find({ ownerId }).lean();

    console.log("[POST /generate] Counts for user:", {
      faculties: faculties.length,
      subjects: subjects.length,
      classes: classes.length,
      combos: combos.length
    });

    const { fixedSlots } = req.body;

    const result = generator.generate({
      faculties, subjects, classes, combos,
      DAYS_PER_WEEK: 5, HOURS_PER_DAY: 9,
      fixed_slots: fixedSlots
    });

    if (!result.ok) {
      console.warn("[POST /generate] Generation failed:", result);
      return res.status(400).json(result);
    }

    const rec = new TimetableResult({
      class_timetables: result.class_timetables,
      faculty_timetables: result.faculty_timetables,
      ownerId: ownerId
    });
    await rec.save();
    console.log("[POST /generate] Saved timetable result");
    res.json({ ok: true, result });
  } catch (e) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

protectedRouter.get('/result/latest', async (req, res) => {
  console.log("[GET /result/latest] Fetching latest timetable result for user:", req.user._id);
  try {
    const r = await TimetableResult.findOne({ ownerId: req.user._id }).sort({ createdAt: -1 }).lean();
    console.log("[GET /result/latest] Found:", r ? "Yes" : "No");
    res.json(r);
  } catch (e) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

protectedRouter.post("/result/regenerate", async (req, res) => {
  try {
    const ownerId = req.user._id;
    const faculties = await Faculty.find({ ownerId }).lean();
    const subjects = await Subject.find({ ownerId }).lean();
    const classes = await ClassModel.find({ ownerId }).lean();
    const combos = await Combo.find({ ownerId }).lean();

    const { fixedSlots } = req.body;

    const { bestClassTimetables, bestFacultyTimetables, bestScore } = runGenerate({
      faculties,
      subjects,
      classes,
      combos,
      fixedSlots,
    });

    if (!bestClassTimetables) {
      console.warn("[POST /generate] Generation failed: No valid timetable found.");
      return res.status(400).json({ ok: false, error: "Failed to generate timetable." });
    }

    const rec = new TimetableResult({
      class_timetables: bestClassTimetables,
      faculty_timetables: bestFacultyTimetables,
      score: bestScore,
      ownerId: ownerId
    });

    await rec.save();
    console.log("[POST /generate] Saved timetable result");

    res.json({
      ok: true,
      score: bestScore,
      class_timetables: bestClassTimetables,
      faculty_timetables: bestFacultyTimetables,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

protectedRouter.delete("/timetables", async (req, res) => {
  try {
    // Delete all timetables for the current user
    const result = await TimetableResult.deleteMany({ ownerId: req.user._id });

    res.status(200).json({
      ok: true,
      deletedCount: result.deletedCount, // tells how many docs were removed
      message: "All your timetables have been deleted successfully"
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Internal Server Error" });
  }
});

router.use(protectedRouter);

export default router;

