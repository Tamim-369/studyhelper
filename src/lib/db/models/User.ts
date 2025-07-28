import mongoose, { Schema, Document } from "mongoose";
import { User } from "@/types";

export interface UserDocument extends Omit<User, "_id">, Document {}

const UserSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    avatar: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes (email index is already created by unique: true)
UserSchema.index({ role: 1 });

export default mongoose.models.User ||
  mongoose.model<UserDocument>("User", UserSchema);
