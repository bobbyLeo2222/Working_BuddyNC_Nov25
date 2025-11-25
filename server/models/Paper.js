import mongoose from 'mongoose';

const { Schema } = mongoose;

const PaperSchema = new Schema(
  {
    paperId: { type: String, required: true, unique: true, index: true },
    level: { type: String, required: true, index: true },
    subject: { type: String, required: true, index: true },
    year: { type: Number, required: true, index: true },
    school: { type: String, required: true, index: true },
    examType: { type: String, default: 'prelim', index: true },
    title: { type: String, required: true },
    booklet: { type: String },
    sections: { type: [Schema.Types.Mixed], default: [] },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

PaperSchema.methods.toSummary = function toSummary({ includeContent = false } = {}) {
  const base = {
    id: this.paperId,
    paperId: this.paperId,
    level: this.level,
    subject: this.subject,
    year: this.year,
    school: this.school,
    examType: this.examType,
    title: this.title,
    booklet: this.booklet ?? null,
    questionCount: Array.isArray(this.sections)
      ? this.sections.reduce((acc, section) => {
          const sectionQuestions = Array.isArray(section?.questions) ? section.questions.length : 0;
          return acc + sectionQuestions;
        }, 0)
      : 0,
    metadata: this.metadata ?? null,
  };

  if (includeContent) {
    base.sections = Array.isArray(this.sections) ? this.sections : [];
  }

  return base;
};

PaperSchema.methods.toExam = function toExam() {
  return {
    id: this.paperId,
    title: this.title,
    booklet: this.booklet ?? null,
    sections: Array.isArray(this.sections) ? this.sections : [],
  };
};

const Paper = mongoose.models.Paper || mongoose.model('Paper', PaperSchema);

export default Paper;
