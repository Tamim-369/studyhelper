import mongoose, { Schema, Document } from "mongoose";
import { AIQuestion } from "@/types";

export interface AIQuestionDocument extends Omit<AIQuestion, "_id">, Document {}

const AIQuestionSchema = new Schema<AIQuestionDocument>({
  explanationId: {
    type: Schema.Types.ObjectId,
    ref: "AIExplanation",
    required: true,
  },
  userId: {
    type: String,
    default: "anonymous",
  },
  question: {
    type: String,
    required: true,
    trim: true,
  },
  answer: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes
AIQuestionSchema.index({ explanationId: 1, createdAt: 1 });
AIQuestionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.AIQuestion ||
  mongoose.model<AIQuestionDocument>("AIQuestion", AIQuestionSchema);
