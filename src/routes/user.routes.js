import express from "express";
import {registerLimiter} from "../middleware/rateLimit.js";

import {
  registerUser,
  updateUser,
  getUsers,
  findNearbyDoctors,
  bulkSoftDeleteUsers
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/register",registerUser);
router.put("/:userId", updateUser);
router.get("/", getUsers);
router.post("/bulk-delete", bulkSoftDeleteUsers);
router.get("/nearby-doctors", findNearbyDoctors);

export default router;