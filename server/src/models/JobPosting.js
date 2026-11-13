import mongoose from 'mongoose';

export const JOB_STATUSES = ['Open', 'Closed'];

const jobPostingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    company: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, default: '', maxlength: 5000 },
    skills: {
      type: [String],
      validate: [(v) => Array.isArray(v) && v.length > 0, 'At least one required skill is needed'],
    },
    minCgpa: { type: Number, min: 0, max: 10, default: null },
    status: { type: String, enum: JOB_STATUSES, default: 'Open', index: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Denormalized counter so dashboards don't need to count applications
    applicantCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

jobPostingSchema.index({ createdAt: -1 });

// Works for both documents and .lean() objects
export function serializeJob(job) {
  return {
    id: job._id.toString(),
    title: job.title,
    company: job.company,
    description: job.description || '',
    skills: job.skills || [],
    minCgpa: job.minCgpa ?? null,
    status: job.status,
    count: job.applicantCount || 0,
    createdAt: job.createdAt,
  };
}

export default mongoose.model('JobPosting', jobPostingSchema);
