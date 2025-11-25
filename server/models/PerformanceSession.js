import mongoose from 'mongoose';

const topicBreakdownSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true },
    attempted: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
  },
  { _id: false }
);

const performanceSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionType: {
      type: String,
      enum: ['practice', 'paper'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    paperId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    paperTitle: {
      type: String,
      trim: true,
      default: null,
    },
    level: {
      type: String,
      trim: true,
      default: null,
    },
    subject: {
      type: String,
      trim: true,
      default: null,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    correct: {
      type: Number,
      default: 0,
    },
    incorrect: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    tokensEarned: {
      type: Number,
      default: 0,
    },
    tokensSpent: {
      type: Number,
      default: 0,
    },
    streak: {
      type: Number,
      default: 0,
    },
    bestStreak: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
      index: true,
    },
    topics: {
      type: [topicBreakdownSchema],
      default: [],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

performanceSessionSchema.index({ user: 1, sessionType: 1, completedAt: -1 });

performanceSessionSchema.methods.toSummary = function toSummary() {
  return {
    id: this._id.toString(),
    sessionType: this.sessionType,
    title: this.title,
    paperId: this.paperId,
    paperTitle: this.paperTitle,
    level: this.level,
    subject: this.subject,
    totalQuestions: this.totalQuestions,
    correct: this.correct,
    incorrect: this.incorrect,
    accuracy: this.accuracy,
    durationSeconds: this.durationSeconds,
    tokensEarned: this.tokensEarned,
    tokensSpent: this.tokensSpent,
    streak: this.streak,
    bestStreak: this.bestStreak,
    startedAt: this.startedAt,
    completedAt: this.completedAt,
    topics: Array.isArray(this.topics) ? this.topics : [],
  };
};

const PerformanceSession = mongoose.model('PerformanceSession', performanceSessionSchema);

export default PerformanceSession;
