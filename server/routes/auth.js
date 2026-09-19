const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuid } = require("uuid");
const db = require("../db");
const { requireAuth, JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    grade: u.grade,
    isPremium: !!u.is_premium,
    studyWindowStart: u.study_window_start,
    studyWindowEnd: u.study_window_end,
    onboarded: !!u.onboarded,
    createdAt: u.created_at,
  };
}

function sign(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
}

router.post("/signup", (req, res) => {
  const { name, email, password, grade } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);
  if (existing) return res.status(409).json({ error: "An account with that email already exists." });

  const id = uuid();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    `INSERT INTO users (id, name, email, password_hash, grade) VALUES (?, ?, ?, ?, ?)`
  ).run(id, name.trim(), normalizedEmail, hash, grade || null);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  res.status(201).json({ token: sign(id), user: publicUser(user) });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required." });
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(normalizedEmail);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password." });
  }
  res.json({ token: sign(user.id), user: publicUser(user) });
});

router.get("/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user: publicUser(user) });
});

router.put("/me", requireAuth, (req, res) => {
  const { name, grade, studyWindowStart, studyWindowEnd, onboarded } = req.body || {};
  const current = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
  if (!current) return res.status(404).json({ error: "User not found." });
  db.prepare(
    `UPDATE users SET name = ?, grade = ?, study_window_start = ?, study_window_end = ?, onboarded = ? WHERE id = ?`
  ).run(
    name ?? current.name,
    grade ?? current.grade,
    studyWindowStart ?? current.study_window_start,
    studyWindowEnd ?? current.study_window_end,
    onboarded === undefined ? current.onboarded : onboarded ? 1 : 0,
    req.userId
  );
  const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
  res.json({ user: publicUser(updated) });
});

module.exports = { router, publicUser };
