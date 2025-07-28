import mongoose, { Schema, Document } from "mongoose";
import { Book } from "@/types";

export interface BookDocument extends Omit<Book, "_id">, Document {}

const BookSchema = new Schema<BookDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    totalPages: {
      type: Number,
      required: true,
    },
    uploadedBy: {
      type: String,
      default: "Anonymous",
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    thumbnail: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
BookSchema.index({ title: "text", author: "text", description: "text" });
BookSchema.index({ uploadedBy: 1 });
BookSchema.index({ isPublic: 1 });
BookSchema.index({ tags: 1 });
BookSchema.index({ uploadedAt: -1 });

export default mongoose.models.Book ||
  mongoose.model<BookDocument>("Book", BookSchema);
