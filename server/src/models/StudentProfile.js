import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    // Denormalized from User so leaderboards load without a join
    name: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true },
    department: { type: String, trim: true, default: '' },
    // Self-reported (honor system) — no document verification in this phase
    cgpa: { type: Number, min: 0, max: 10, default: null },
    linkedin: { type: String, trim: true, default: '' },
    skills: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
    projects: { type: [String], default: [] },
    resume: {
      path: { type: String, select: false },
      originalName: String,
      mimeType: String,
      uploadedAt: Date,
    },
    // Skills detected from the uploaded resume text
    extractedSkills: { type: [String], default: [] },
    // Plain text read from the resume, kept so the AI never needs to re-read the file
    resumeText: { type: String, select: false, default: '' },
    // Latest AI suggestions, cached so the Groq API is only called when something changes
    aiInsights: {
      status: { type: String, enum: ['idle', 'pending', 'ready', 'failed'], default: 'idle' },
      summary: String,
      strengths: [String],
      gaps: [String],
      suggestions: [{ _id: false, title: String, detail: String, priority: String }],
      jobFits: [{ _id: false, jobId: String, title: String, company: String, fit: String, reason: String, nextStep: String }],
      // Hash of the inputs used; if the inputs hash the same, the cached result is reused
      fingerprint: String,
      model: String,
      error: String,
      requestedAt: Date,
      generatedAt: Date,
      // Per-student daily cap on Groq calls
      dailyRuns: { type: Number, default: 0 },
      dailyRunsDate: String,
    },
    // Lower-cased union of skills + extractedSkills, used for fast matching queries
    skillIndex: { type: [String], default: [], index: true },
  },
  { timestamps: true }
);

studentProfileSchema.pre('save', function buildSkillIndex(next) {
  const all = [...(this.skills || []), ...(this.extractedSkills || [])].map((s) => s.toLowerCase().trim());
  this.skillIndex = [...new Set(all.filter(Boolean))];
  next();
});

// What the frontend sees (the internal fingerprint is left out)
export function publicInsights(ai) {
  if (!ai?.status) return { status: 'idle' };
  const plain = typeof ai.toObject === 'function' ? ai.toObject() : { ...ai };
  delete plain.fingerprint;
  return plain;
}

studentProfileSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    userId: this.user.toString(),
    name: this.name,
    email: this.email,
    department: this.department,
    cgpa: this.cgpa,
    linkedin: this.linkedin,
    skills: this.skills,
    certifications: this.certifications,
    projects: this.projects,
    extractedSkills: this.extractedSkills,
    resume: this.resume?.originalName
      ? { originalName: this.resume.originalName, uploadedAt: this.resume.uploadedAt }
      : null,
    aiInsights: publicInsights(this.aiInsights),
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model('StudentProfile', studentProfileSchema);
