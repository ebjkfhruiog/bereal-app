require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { router: authRouter } = require("./routes/auth");
const eventsRouter = require("./routes/events");
const testsRouter = require("./routes/tests");
const sessionsRouter = require("./routes/sessions");
const statsRouter = require("./routes/stats");
const premiumRouter = require("./routes/premium");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/events", eventsRouter);
app.use("/api/tests", testsRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/stats", statsRouter);
app.use("/api/premium", premiumRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Stubby API listening on :${PORT}`));
