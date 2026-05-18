import mongoose from "mongoose";

import emailSchema from "./email.model.js";
import phoneSchema from "./phone.model.js";
import addressModel from "./address.model.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["doctor", "patient", "admin"],
      required: true,
    },
    phones: [phoneSchema],
    emails: [emailSchema],
    addresses: [addressModel],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    profileImage: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({
  "addresses.location": "2dsphere",
});

userSchema.index({ role: 1 });

userSchema.index({ name: 1 });

userSchema.index({ "phones.number": 1 });

userSchema.index({ "emails.email": 1 });

const User = mongoose.model("User", userSchema);

export default User;
