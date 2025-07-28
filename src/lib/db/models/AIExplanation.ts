import mongoose, { Schema, Document } from "mongoose";
import { AIExplanation } from "@/types";

export interface AIExplanationDocument
  extends Omit<AIExplanation, "_id">,
    Document {}

const AIExplanationSchema = new Schema<AIExplanationDocument>({
  highlightId: {
    type: Schema.Types.ObjectId,
    ref: "Highlight",
    required: true,
  },
  userId: {
    type: String,
    default: "anonymous",
  },
  bookId: {
    type: Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  contextText: {
    type: String,
    required: true,
  },
  explanation: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes
AIExplanationSchema.index({ highlightId: 1 });
AIExplanationSchema.index({ userId: 1, createdAt: -1 });
AIExplanationSchema.index({ bookId: 1 });

export default mongoose.models.AIExplanation ||
  mongoose.model<AIExplanationDocument>("AIExplanation", AIExplanationSchema);
