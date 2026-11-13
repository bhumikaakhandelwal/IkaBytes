import mongoose from 'mongoose';

export const JOB_STATUSES = ['Open', 'Closed'];
export const ALL_DEPARTMENTS = 'All Departments';

const jobPostingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    company: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, default: '', maxlength: 5000 },
    skills: {
      type: [String],
      validate: [(v) => Array.isArray(v) && v.length > 0, 'At least one required skill is needed'],
    },
    // Eligible department, or "All Departments"
    department: { type: String, trim: true, default: ALL_DEPARTMENTS },
    minCgpa: { type: Number, min: 0, max: 10, default: null },
    status: { type: String, enum: JOB_STATUSES, default: 'Open', index: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Student profiles the TPO has shortlisted for this role
    shortlisted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile' }],
    // Denormalized counter so dashboards don't need to count applications
    applicantCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

jobPostingSchema.index({ createdAt: -1 });

// Works for both documents and .lean() objects
export function serializeJob(job) {
  const shortlisted = (job.shortlisted || []).map((id) => id.toString());
  return {
    id: job._id.toString(),
    title: job.title,
    company: job.company,
    description: job.description || '',
    skills: job.skills || [],
    department: job.department || ALL_DEPARTMENTS,
    minCgpa: job.minCgpa ?? null,
    // Same value under the name the frontend uses
    cgpaCutoff: job.minCgpa != null ? Number(job.minCgpa).toFixed(1) : '',
    status: job.status,
    shortlisted,
    shortlistedCount: shortlisted.length,
    count: job.applicantCount || 0,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

export default mongoose.model('JobPosting', jobPostingSchema);
