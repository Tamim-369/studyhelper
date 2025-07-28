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
      default: "Unknown Author",
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
      required: false, // Not required for Google Drive files
    },
    fileSize: {
      type: Number,
      required: true,
    },
    totalPages: {
      type: Number,
      default: 0,
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
    // Google Drive specific fields
    googleDriveId: {
      type: String,
      required: false,
    },
    downloadLink: {
      type: String,
      required: false,
    },
    viewLink: {
      type: String,
      required: false,
    },
    directLink: {
      type: String,
      required: false,
    },
    storageType: {
      type: String,
      enum: ["local", "google-drive"],
      default: "local",
    },
    userId: {
      type: String,
      required: false,
    },
    mimeType: {
      type: String,
      default: "application/pdf",
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
