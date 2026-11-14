// Adds 10 more demo students and 6 more demo roles WITHOUT deleting anything.
// Usage (in the server folder): npm run seed:more
// Safe to run again: students whose email already exists and roles with the same
// title + company are skipped, so nothing is duplicated.
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import StudentProfile from './models/StudentProfile.js';
import JobPosting from './models/JobPosting.js';

const PASSWORD = 'password123';
const DAY = 24 * 60 * 60 * 1000;

const students = [
  {
    name: 'Priya Deshmukh', email: 'priya@college.edu', department: 'Computer Engineering', cgpa: 8.4,
    linkedin: 'linkedin.com/in/priya-deshmukh',
    skills: ['React', 'Node.js', 'MongoDB', 'JavaScript', 'Git'],
    projects: ['https://github.com/priya-d/campus-events', 'https://github.com/priya-d/expense-tracker'],
    certifications: ['Meta Front-End Developer'],
  },
  {
    name: 'Arjun Mehta', email: 'arjun@college.edu', department: 'Information Technology', cgpa: 7.9,
    linkedin: 'linkedin.com/in/arjun-mehta',
    skills: ['Python', 'SQL', 'Pandas', 'Power BI', 'Excel'],
    projects: ['https://github.com/arjunm/sales-dashboard'],
    certifications: ['Google Data Analytics'],
  },
  {
    name: 'Kavya Iyer', email: 'kavya@college.edu', department: 'Electronics', cgpa: 8.7,
    linkedin: 'linkedin.com/in/kavya-iyer',
    skills: ['C', 'C++', 'Linux', 'MATLAB'],
    projects: ['https://github.com/kavya-iyer/smart-irrigation', 'https://github.com/kavya-iyer/rtos-scheduler'],
    certifications: ['NPTEL Embedded Systems Design'],
  },
  {
    name: 'Rahul Kulkarni', email: 'rahul@college.edu', department: 'Mechanical Engineering', cgpa: 7.2,
    linkedin: '',
    skills: ['AutoCAD', 'SolidWorks', 'MATLAB', 'Excel'],
    projects: ['https://github.com/rahulk/gearbox-design'],
    certifications: ['SolidWorks CSWA'],
  },
  {
    name: 'Sneha Joshi', email: 'sneha@college.edu', department: 'Civil Engineering', cgpa: 7.6,
    linkedin: 'linkedin.com/in/sneha-joshi',
    skills: ['AutoCAD', 'Excel', 'Project Management'],
    projects: ['https://github.com/snehaj/site-cost-estimator'],
    certifications: ['Primavera P6 Fundamentals'],
  },
  {
    name: 'Vikram Rao', email: 'vikram@college.edu', department: 'Computer Engineering', cgpa: 6.8,
    linkedin: 'linkedin.com/in/vikram-rao',
    skills: ['Java', 'Spring Boot', 'SQL', 'Docker'],
    projects: ['https://github.com/vikramrao/library-api'],
    certifications: [],
  },
  {
    name: 'Ananya Gupta', email: 'ananya@college.edu', department: 'Electronics and Computer Science Engineering', cgpa: 9.2,
    linkedin: 'linkedin.com/in/ananya-gupta',
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'Pandas', 'SQL'],
    projects: ['https://github.com/ananya-g/crop-disease-cnn', 'https://github.com/ananya-g/resume-ranker', 'https://github.com/ananya-g/stock-lstm'],
    certifications: ['DeepLearning.AI Machine Learning Specialization', 'AWS Cloud Practitioner'],
  },
  {
    name: 'Omkar Pawar', email: 'omkar@college.edu', department: 'Information Technology', cgpa: 7.1,
    linkedin: '',
    skills: ['JavaScript', 'HTML', 'CSS', 'React'],
    projects: ['https://github.com/omkarp/portfolio'],
    certifications: [],
  },
  // Deliberately incomplete profiles, so the Students directory shows "Missing: …"
  {
    name: 'Isha Verma', email: 'isha@college.edu', department: 'Computer Engineering', cgpa: null,
    linkedin: 'linkedin.com/in/isha-verma',
    skills: ['Python', 'Data Structures', 'Algorithms'],
    projects: [],
    certifications: [],
  },
  {
    name: 'Siddharth Nair', email: 'siddharth@college.edu', department: 'Mechanical Engineering', cgpa: 6.9,
    linkedin: '',
    skills: [],
    projects: [],
    certifications: [],
  },
];

// daysAgo spreads the postings over the last two months so Skill gaps can show trends
const jobs = [
  {
    title: 'Full Stack Developer', company: 'Zoho', department: 'Computer Engineering', minCgpa: 7.0, daysAgo: 5,
    skills: ['React', 'Node.js', 'MongoDB'],
    description: 'Build and ship features across the stack for a SaaS product used by millions.',
  },
  {
    title: 'Data Engineer', company: 'Fractal Analytics', department: 'Information Technology', minCgpa: 7.0, daysAgo: 12,
    skills: ['Python', 'SQL', 'AWS'],
    description: 'Design data pipelines and keep analytics data clean, fast and reliable.',
  },
  {
    title: 'Machine Learning Intern', company: 'Tredence', department: 'All Departments', minCgpa: 7.5, daysAgo: 20,
    skills: ['Python', 'Machine Learning', 'Pandas'],
    description: 'Six-month internship training and evaluating models for retail clients.',
  },
  {
    title: 'Embedded Systems Trainee', company: 'Bosch', department: 'Electronics', minCgpa: 6.5, daysAgo: 34,
    skills: ['C', 'C++', 'Linux'],
    description: 'Develop and test firmware for automotive electronic control units.',
  },
  {
    title: 'Graduate Engineer Trainee – Civil', company: 'Larsen & Toubro', department: 'Civil Engineering', minCgpa: 6.0, daysAgo: 43,
    skills: ['AutoCAD', 'Excel', 'Project Management'],
    description: 'Site execution, quantity estimation and planning on infrastructure projects.',
  },
  {
    title: 'Design Engineer', company: 'Tata Motors', department: 'Mechanical Engineering', minCgpa: 6.5, daysAgo: 55,
    skills: ['SolidWorks', 'AutoCAD', 'MATLAB'],
    description: 'Create and validate component designs for commercial vehicle platforms.',
  },
];

const demoLink = (name) => `https://www.credly.com/badges/demo-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

async function seedMore() {
  await connectDB(process.env.MONGODB_URI);
  const passwordHash = await User.hashPassword(PASSWORD);

  // Roles need an officer as "postedBy": use the existing one, or create the demo officer
  let officer = await User.findOne({ role: 'tpo' });
  if (!officer) {
    officer = await User.create({ name: 'Placement Officer', email: 'officer@college.edu', role: 'tpo', passwordHash });
    console.log('Created officer@college.edu (no placement officer existed).');
  }

  let addedStudents = 0;
  for (const s of students) {
    if (await User.exists({ email: s.email })) {
      console.log(`  skip  student ${s.email} (already exists)`);
      continue;
    }
    const user = await User.create({ name: s.name, email: s.email, role: 'student', passwordHash });
    const { email, ...profile } = s;
    // Every certification needs proof; demo data uses sample links
    const certificationProofs = profile.certifications.map((name) => ({ name, url: demoLink(name) }));
    // create() (not insertMany) so the skill index used by matching is built
    await StudentProfile.create({ ...profile, certificationProofs, email, user: user._id });
    addedStudents += 1;
    console.log(`  added student ${s.email}`);
  }

  let addedJobs = 0;
  for (const { daysAgo, ...j } of jobs) {
    if (await JobPosting.exists({ title: j.title, company: j.company })) {
      console.log(`  skip  role "${j.title}" at ${j.company} (already exists)`);
      continue;
    }
    const job = await JobPosting.create({ ...j, postedBy: officer._id });
    // Backdate the posting (written directly so Mongoose doesn't reset the timestamp)
    await JobPosting.collection.updateOne({ _id: job._id }, { $set: { createdAt: new Date(Date.now() - daysAgo * DAY) } });
    addedJobs += 1;
    console.log(`  added role "${j.title}" at ${j.company}`);
  }

  console.log(`\nDone: ${addedStudents} student(s) and ${addedJobs} role(s) added. Nothing was deleted.`);
  if (addedStudents) console.log(`New students log in with their email and password: ${PASSWORD}`);
  await mongoose.disconnect();
}

seedMore().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
