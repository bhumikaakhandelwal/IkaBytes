import mongoose from 'mongoose';

export const APPLICATION_STATUSES = ['applied', 'shortlisted', 'rejected', 'selected'];

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPosting', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    profile: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
    status: { type: String, enum: APPLICATION_STATUSES, default: 'applied' },
    matchScore: { type: Number, min: 0, max: 100 },
    // Snapshots so the officer's list loads without extra lookups
    jobSnapshot: { title: String, company: String },
    studentSnapshot: { name: String, department: String, cgpa: Number, skills: [String] },
  },
  { timestamps: true }
);

applicationSchema.index({ job: 1, student: 1 }, { unique: true });

export default mongoose.model('Application', applicationSchema);
