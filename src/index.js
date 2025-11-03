import express from "express";
import bodyParser from "body-parser";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(bodyParser.json());

// ✅ Signup
app.post("/signup", async (req, res) => {
  const { email, name } = req.body;
  try {
    const user = await prisma.user.create({ data: { email, name } });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Signup failed" });
  }
});

// ✅ Signin (check if user exists)
app.post("/signin", async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// ✅ Create Group
app.post("/groups", async (req, res) => {
  const { name } = req.body;
  const group = await prisma.group.create({ data: { name } });
  res.json(group);
});

// ✅ Join Group
app.post("/groups/join", async (req, res) => {
  const { userId, groupId } = req.body;
  try {
    const member = await prisma.groupMember.create({
      data: { userId, groupId },
    });
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: "Failed to join group" });
  }
});

// ✅ Submit Usage
app.post("/usage", async (req, res) => {
  const { userId, groupId, duration } = req.body;
  try {
    const usage = await prisma.usage.create({
      data: {
        userId,
        groupId,
        duration,
        date: new Date(),
      },
    });
    res.json(usage);
  } catch (error) {
    res.status(500).json({ error: "Failed to submit usage" });
  }
});

// ✅ Select Daily Winner
app.post("/winner/daily/:group_id", async (req, res) => {
  try {
    const groupId = parseInt(req.params.group_id);
    const usages = await prisma.usage.findMany({
      where: { groupId },
      include: { user: true },
    });

    const members = await prisma.groupMember.findMany({ where: { groupId } });

    if (usages.length < members.length) {
      return res.json({ message: "Not all members have submitted data yet." });
    }

    const winner = usages.reduce(
      (min, u) => (u.duration < min.duration ? u : min),
      usages[0]
    );

    const rewardAmount = 100; // Fixed reward
    const updatedUser = await prisma.user.update({
      where: { id: winner.userId },
      data: { balance: { increment: rewardAmount } },
    });

    res.json({
      message: `Winner: ${winner.user.email}`,
      newBalance: updatedUser.balance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to calculate winner" });
  }
});

// ✅ Subtract Balance (manual)
app.post("/subtract-balance/:user_id", async (req, res) => {
  try {
    const userId = parseInt(req.params.user_id);
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (amount > user.balance) {
      return res.status(400).json({ error: "Amount exceeds balance" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { balance: { decrement: amount } },
    });

    res.json({
      message: `Balance reduced by ${amount}`,
      newBalance: updatedUser.balance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to subtract balance" });
  }
});

// ✅ Get Group Balances
app.get("/balances/:group_id", async (req, res) => {
  const groupId = parseInt(req.params.group_id);
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: { user: true },
  });

  const balances = members.map((m) => ({
    email: m.user.email,
    balance: m.user.balance,
  }));

  res.json(balances);
});

app.listen(process.env.PORT || 3000, () => console.log("Server running "));
