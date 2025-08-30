const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Connect to MongoDB
mongoose.connect(
  "mongodb://atlas-sql-68b3330318374a02bab15182-zad3xy.a.query.mongodb.net/sample_mflix?ssl=true&authSource=admin",
  { useNewUrlParser: true, useUnifiedTopology: true }
)
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// ================= SCHEMAS =================
const courseSchema = new mongoose.Schema({
  title: String,
  code: { type: String, unique: true },
  description: String
});

const studentSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  enrolledCourses: [String]
});

const feedbackSchema = new mongoose.Schema({
  studentEmail: String,
  courseCode: String,
  feedback: String
});

const Course = mongoose.model("Course", courseSchema);
const Student = mongoose.model("Student", studentSchema);
const Feedback = mongoose.model("Feedback", feedbackSchema);

// ================= ROUTES =================

// ----- Courses -----
app.post("/courses", async (req, res) => {
  try {
    const course = new Course(req.body);
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/courses", async (req, res) => {
  res.json(await Course.find());
});

app.get("/courses/:code", async (req, res) => {
  const course = await Course.findOne({ code: req.params.code });
  if (!course) return res.status(404).json({ error: "Course not found" });
  res.json(course);
});

app.put("/courses/:code", async (req, res) => {
  const updated = await Course.findOneAndUpdate(
    { code: req.params.code },
    req.body,
    { new: true }
  );
  if (!updated) return res.status(404).json({ error: "Course not found" });
  res.json(updated);
});

app.delete("/courses/:code", async (req, res) => {
  const deleted = await Course.findOneAndDelete({ code: req.params.code });
  if (!deleted) return res.status(404).json({ error: "Course not found" });
  res.json({ message: "Course deleted" });
});

// ----- Students -----
app.post("/students", async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/students", async (req, res) => {
  res.json(await Student.find());
});

app.post("/students/:email/enroll", async (req, res) => {
  const { courseCode } = req.body;
  const student = await Student.findOne({ email: req.params.email });
  if (!student) return res.status(404).json({ error: "Student not found" });

  const course = await Course.findOne({ code: courseCode });
  if (!course) return res.status(404).json({ error: "Course not found" });

  if (!student.enrolledCourses.includes(courseCode)) {
    student.enrolledCourses.push(courseCode);
    await student.save();
  }

  res.json(student);
});

app.get("/students/:email/courses", async (req, res) => {
  const student = await Student.findOne({ email: req.params.email });
  if (!student) return res.status(404).json({ error: "Student not found" });
  res.json(student.enrolledCourses);
});

// ----- Feedback -----
app.post("/feedback", async (req, res) => {
  const { studentEmail, courseCode, feedback } = req.body;
  const student = await Student.findOne({ email: studentEmail });
  if (!student) return res.status(404).json({ error: "Student not found" });

  if (!student.enrolledCourses.includes(courseCode)) {
    return res.status(400).json({ error: "Student not enrolled in this course" });
  }

  const course = await Course.findOne({ code: courseCode });
  if (!course) return res.status(404).json({ error: "Course not found" });

  try {
    const fb = new Feedback({ studentEmail, courseCode, feedback });
    await fb.save();
    res.status(201).json(fb);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/feedback/:courseCode", async (req, res) => {
  res.json(await Feedback.find({ courseCode: req.params.courseCode }));
});

app.put("/feedback/:id", async (req, res) => {
  const updated = await Feedback.findByIdAndUpdate(
    req.params.id,
    { feedback: req.body.feedback },
    { new: true }
  );
  if (!updated) return res.status(404).json({ error: "Feedback not found" });
  res.json(updated);
});

app.delete("/feedback/:id", async (req, res) => {
  const deleted = await Feedback.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Feedback not found" });
  res.json({ message: "Feedback deleted" });
});

// ----- Feedback Form -----
app.get("/feedback/form", (req, res) => {
  res.send(`
    <form method="POST" action="/feedback">
      <label>Student Email: <input type="email" name="studentEmail" required /></label><br/>
      <label>Course Code: <input type="text" name="courseCode" required /></label><br/>
      <label>Feedback: <textarea name="feedback" required></textarea></label><br/>
      <button type="submit">Submit Feedback</button>
    </form>
  `);
});

// ================= SERVER =================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

