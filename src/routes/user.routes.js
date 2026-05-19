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

router.post("/register",registerLimiter,registerUser);
router.put("/:userId",registerLimiter, updateUser);
router.get("/", registerLimiter, getUsers);
router.post("/bulk-delete", bulkSoftDeleteUsers);
router.get("/nearby-doctors", findNearbyDoctors);

export default router;