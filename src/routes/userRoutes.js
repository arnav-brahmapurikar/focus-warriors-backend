import express from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const router = express.Router();

// Signup
router.post("/signup", async (req, res) => {
  const { email, name } = req.body;
  try {
    const user = await prisma.user.create({ data: { email, name } });
    res.json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Signin (simple)
router.post("/signin", async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

export default router;
