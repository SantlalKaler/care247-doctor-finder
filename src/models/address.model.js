import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["home", "clinic", "hospital", "work", "other"],
      default: "other",
    },

    addressLine1: String,
    addressLine2: String,

    city: String,
    state: String,
    country: String,
    pincode: String,

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },

      coordinates: {
        type: [Number], // [lng, lat]
        default: [0, 0],
      },
    },

    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true },
);

export default addressSchema;
