import mongoose, { Schema, Document } from "mongoose";
import { Highlight } from "@/types";

export interface HighlightDocument extends Omit<Highlight, "_id">, Document {}

const HighlightSchema = new Schema<HighlightDocument>(
  {
    bookId: {
      type: Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    userId: {
      type: String,
      default: "anonymous",
    },
    pageNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    selectedText: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      x: {
        type: Number,
        required: true,
      },
      y: {
        type: Number,
        required: true,
      },
      width: {
        type: Number,
        required: true,
      },
      height: {
        type: Number,
        required: true,
      },
    },
    color: {
      type: String,
      default: "#ffeb3b", // Yellow highlight by default
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
HighlightSchema.index({ bookId: 1, userId: 1 });
HighlightSchema.index({ userId: 1, createdAt: -1 });
HighlightSchema.index({ bookId: 1, pageNumber: 1 });

export default mongoose.models.Highlight ||
  mongoose.model<HighlightDocument>("Highlight", HighlightSchema);
