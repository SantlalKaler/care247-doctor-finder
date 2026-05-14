import express from "express";
import {registerLimiter} from "../middleware/rateLimit.js";

import {
  registerUser,
  updateUser,
  getUsers,
  findNearbyDoctors
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/register",registerUser);
router.put("/:userId", updateUser);
router.get("/", getUsers);
router.get("/nearby-doctors", findNearbyDoctors);

export default router;