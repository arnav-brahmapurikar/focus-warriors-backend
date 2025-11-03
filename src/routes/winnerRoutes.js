import express from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const router = express.Router();

router.post("/daily/:group_id", async (req, res) => {
  const group_id = parseInt(req.params.group_id);
  const dateStr = new Date().toISOString().split("T")[0];

  try {
    const memberCount = await prisma.groupMember.count({ where: { group_id } });
    const usageData = await prisma.usage.groupBy({
      by: ["user_email"],
      where: { group_id, date: dateStr },
      _sum: { screen_time_minutes: true },
      orderBy: { _sum: { screen_time_minutes: "asc" } },
    });

    if (usageData.length < memberCount)
      return res.json({
        message: `Not all members submitted screen time yet. (${usageData.length}/${memberCount})`,
      });

    const minTime = usageData[0]._sum.screen_time_minutes;
    const winners = usageData.filter(
      (u) => u._sum.screen_time_minutes === minTime
    );

    const reward = 100;
    const rewardPerWinner = Math.floor(reward / winners.length);

    for (const w of winners) {
      await prisma.user.update({
        where: { email: w.user_email },
        data: { balance: { increment: rewardPerWinner } },
      });
    }

    await prisma.dailyResult.create({
      data: {
        group_id,
        date: new Date(dateStr),
        winner_email: winners.map((w) => w.user_email).join(", "),
        total_time: minTime,
      },
    });

    res.json({
      message: "✅ Daily winner calculated",
      winners: winners.map((w) => w.user_email),
      rewardPerWinner,
      total_time: minTime,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
