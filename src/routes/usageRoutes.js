import express from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const router = express.Router();

// Post daily usage
router.post("/", async (req, res) => {
  const { email, group_id, screen_time_minutes } = req.body;
  const dateStr = new Date().toISOString().split("T")[0];

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const existing = await prisma.usage.findFirst({
      where: { user_id: user.id, group_id, date: dateStr },
    });
    if (existing)
      return res.json({ message: "Already submitted for today!" });

    const usage = await prisma.usage.create({
      data: {
        user_id: user.id,
        user_email: email,
        group_id,
        date: dateStr,
        screen_time_minutes,
      },
    });

    res.json(usage);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
