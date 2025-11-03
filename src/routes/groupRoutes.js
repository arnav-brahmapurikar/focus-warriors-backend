import express from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const router = express.Router();

// Create group
router.post("/create", async (req, res) => {
  const { name, createdBy } = req.body;
  try {
    const group = await prisma.group.create({
      data: { name, createdBy },
    });
    res.json(group);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Join group
router.post("/join", async (req, res) => {
  const { email, group_id } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const existing = await prisma.groupMember.findFirst({
      where: { user_id: user.id, group_id },
    });
    if (existing) return res.json({ message: "Already joined" });

    const joined = await prisma.groupMember.create({
      data: { user_id: user.id, group_id },
    });
    res.json(joined);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
