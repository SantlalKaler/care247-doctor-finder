import mongoose from "mongoose";

const phoneSchema = new mongoose.Schema(
  {
    countryCode: {
      type: String,
      default: "+91",
    },

    number: {
      type: String,
      required: true,
      trim: true,
    },

    isPrimary: {
      type: Boolean,
      default: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    label: {
      type: String,
      enum: ["personal", "work", "home", "other"],
      default: "personal",
    },
  },
  { _id: false }
);

export default phoneSchema;