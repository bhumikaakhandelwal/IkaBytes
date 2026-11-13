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
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model('StudentProfile', studentProfileSchema);
