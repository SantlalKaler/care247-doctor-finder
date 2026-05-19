import User from "../models/user.model.js";
import Doctor from "../models/doctor.model.js";
import { verifyTurnstile } from "../utils/verifyTurnstile.js";

// verify cloud fare

export const registerUser = async (req, res) => {
  try {
    const {
      name,
      role,
      phones,
      emails,
      addresses,

      // doctor fields
      specialization,
      experienceYears,
      consultationModes,

      // security
      captchaToken,
      website,
    } = req.body;

    // ======================
    // Human Verification
    // ======================
    if (!captchaToken) {
      return res.status(400).json({
        success: false,
        message: "Captcha token missing",
      });
    }

    const isHuman = await verifyTurnstile(captchaToken);

    if (!isHuman) {
      return res.status(400).json({
        success: false,
        message: "Captcha verification failed",
      });
    }

    if (req.body.website) {
      return res.status(400).json({
        success: false,
        message: "Bot detected",
      });
    }

    // ======================
    // Validation
    // ======================

    if (!name || !role) {
      return res.status(400).json({
        success: false,
        message: "Name and role are required",
      });
    }

    // ======================
    // Duplicate Phone Check
    // ======================

    const primaryPhone = phones?.[0]?.number;

    if (!primaryPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number required",
      });
    }

    const existingUser = await User.findOne({
      "phones.number": primaryPhone,
    });

    if (existingUser && !existingUser.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    if (existingUser && existingUser.isDeleted) {
      existingUser.isDeleted = false;
      existingUser.isActive = true;

      existingUser.name = name;
      existingUser.role = role;
      existingUser.phones = phones;
      existingUser.emails = emails;
      existingUser.addresses = addresses;

      await existingUser.save();

      return res.status(200).json({
        success: true,
        message: "User restored successfully",
        data: existingUser,
      });
    }

    // ======================
    // Create Base User
    // ======================

    const user = await User.create({
      name,
      role,
      phones,
      emails,
      addresses,
    });

    // ======================
    // Role Specific Logic
    // ======================

    let roleData = null;

    switch (role) {
      case "doctor":
        roleData = await Doctor.create({
          userId: user._id,
          specialization,
          experienceYears,
          consultationModes,
        });
        break;

      case "patient":
        // future patient schema
        break;

      case "admin":
        // future admin schema
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid role",
        });
    }

    return res.status(201).json({
      success: true,
      message: `${role} registered successfully`,
      data: {
        user,
        roleData,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

// ================================
// Edit User
// ================================
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const {
      name,
      phones,
      emails,
      addresses,
      profileImage,

      // doctor fields
      specialization,
      experienceYears,
      consultationModes,
      isAvailable,
    } = req.body;

    // =========================
    // Find Existing User
    // =========================

    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // =========================
    // Duplicate Phone Check
    // =========================

    if (phones?.length > 0) {
      const primaryPhone = phones[0]?.number;

      const duplicateUser = await User.findOne({
        _id: { $ne: userId },
        "phones.number": primaryPhone,
      });

      if (duplicateUser) {
        return res.status(400).json({
          success: false,
          message: "Phone number already in use",
        });
      }
    }

    // =========================
    // Update Base User
    // =========================

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          ...(name && { name }),
          ...(phones && { phones }),
          ...(emails && { emails }),
          ...(addresses && { addresses }),
          ...(profileImage && { profileImage }),
        },
      },
      {
        new: true,
      },
    );

    // =========================
    // Role Specific Updates
    // =========================

    let roleData = null;

    switch (existingUser.role) {
      case "doctor":
        roleData = await Doctor.findOneAndUpdate(
          { userId: userId },
          {
            $set: {
              ...(specialization && { specialization }),
              ...(experienceYears && { experienceYears }),
              ...(consultationModes && { consultationModes }),
              ...(typeof isAvailable === "boolean" && {
                isAvailable,
              }),
            },
          },
          {
            new: true,
          },
        );

        break;

      case "patient":
        break;

      case "admin":
        break;

      default:
        break;
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        user: updatedUser,
        roleData,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

// ================================
// Get All User
// ================================
export const getUsers = async (req, res) => {
  try {
    // =========================
    // Query Params
    // =========================

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const role = req.query.role;
    const search = req.query.search;

    const skip = (page - 1) * limit;

    // =========================
    // Filters
    // =========================

    const filters = {
      isDeleted: { $ne: true },
    };

    if (role) {
      filters.role = role;
    }

    if (search) {
      filters.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },

        {
          "phones.number": {
            $regex: search,
            $options: "i",
          },
        },

        {
          "emails.email": {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // =========================
    // Fetch Users
    // =========================

    const users = await User.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // =========================
    // Total Count
    // =========================

    const totalUsers = await User.countDocuments(filters);

    // =========================
    // Attach Doctor Data
    // =========================

    const userIds = users.map((u) => u._id);

    const doctors = await Doctor.find({
      userId: { $in: userIds },
    }).lean();

    // =========================
    // Merge Data
    // =========================

    const mergedUsers = users.map((user) => {
      let roleData = null;

      if (user.role === "doctor") {
        roleData = doctors.find(
          (d) => d.userId.toString() === user._id.toString(),
        );
      }

      return {
        ...user,
        roleData,
      };
    });

    // =========================
    // Response
    // =========================

    return res.status(200).json({
      success: true,

      pagination: {
        total: totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit),
      },

      data: mergedUsers,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

// ================================
// Delete multiple users
// ================================
export const bulkSoftDeleteUsers = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Ids are required",
      });
    }

    const result = await User.updateMany(
      {
        _id: { $in: ids },
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "Doctors deleted successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete doctors",
      error: error.message,
    });
  }
};

// ================================
// Get Nearby Doctors
// ================================
export const findNearbyDoctors = async (req, res) => {
  try {
    const { lat, lng, radius = 10, page = 1, limit = 20 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "lat and lng are required",
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusInMeters = parseFloat(radius) * 1000;

    const skip = (Number(page) - 1) * Number(limit);

    const doctors = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude],
          },

          distanceField: "distance",

          maxDistance: radiusInMeters,

          spherical: true,

          key: "addresses.location",

          query: {
            role: "doctor",
            isActive: true,
            isDeleted: { $ne: true },
          },
        },
      },

      {
        $lookup: {
          from: "doctors",
          localField: "_id",
          foreignField: "userId",
          as: "doctorProfile",
        },
      },

      {
        $unwind: {
          path: "$doctorProfile",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $addFields: {
          matchedAddress: {
            $first: "$addresses",
          },
        },
      },

      {
        $sort: {
          distance: 1,
        },
      },

      {
        $skip: skip,
      },

      {
        $limit: Number(limit),
      },

      {
        $project: {
          name: 1,
          role: 1,

          phones: 1,
          emails: 1,

          address: "$matchedAddress",

          roleData: "$doctorProfile",

          distanceInKm: {
            $round: [
              {
                $divide: ["$distance", 1000],
              },
              2,
            ],
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      total: doctors.length,
      data: doctors,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to find nearby doctors",
      error: error.message,
    });
  }
};
