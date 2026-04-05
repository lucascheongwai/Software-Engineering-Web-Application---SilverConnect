import { Request, Response } from "express";
import pool from "../db";
import { checkPassword, hashPassword } from "../utils/hash";

function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

function toTextArray(input: unknown): string[] | null {
  if (Array.isArray(input)) {
    return input.map(String).map(s => s.trim()).filter(Boolean);
  }
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return [];
    return trimmed.split(",").map(s => s.trim()).filter(Boolean);
  }
  return null;
}

export const AuthController = {
  // Login
  async login(req: Request, res: Response) {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ ok: false, msg: "Missing username/email or password" });
    }

    try {
      const q = await pool.query(
        `SELECT id, name, email, password, role, preferred_language, image_url
         FROM users
         WHERE email = $1 OR name = $1`,
        [emailOrUsername]
      );

      if (q.rows.length === 0) {
        return res.status(401).json({ ok: false, msg: "Invalid username/email or password" });
      }

      const user = q.rows[0];
      const valid = await checkPassword(password, user.password);
      if (!valid) {
        return res.status(401).json({ ok: false, msg: "Invalid username/email or password" });
      }

      return res.json({
        ok: true,
        msg: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.toLowerCase(),
          preferredLanguage: user.preferred_language,
          image_url: user.image_url,
        },
      });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ ok: false, msg: "Server error. Please try again." });
    }
  },

  // Signup
  async signup(req: Request, res: Response) {
    const {
      name,
      email,
      password,
      role,
      age,
      phoneNumber,
      preferredLanguage,
      elderlyEmail,
      relationship,
      paEmail,
      preferredActivities,
      availability,
      travelDistance,
    } = req.body as any;

    const phone =
      (typeof phoneNumber === "string" && phoneNumber) ||
      (typeof req.body.contact_number === "string" && req.body.contact_number) ||
      null;

    const prefLang =
      (typeof preferredLanguage === "string" && preferredLanguage) ||
      (typeof req.body.preferred_language === "string" && req.body.preferred_language) ||
      null;

    const activitiesArray = toTextArray(preferredActivities ?? req.body.preferred_activities) ?? [];
    const availabilityArray = toTextArray(availability ?? req.body.availability) ?? [];

    // Universal validations
    if (!name || !email || !password || !role) {
      return res.status(400).json({ ok: false, msg: "Missing required fields" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ ok: false, msg: "Invalid email format" });
    }

    if (password.length < 6) {
      return res.status(400).json({ ok: false, msg: "Password must be at least 6 characters" });
    }

    if (isNaN(Number(age)) || Number(age) <= 0) {
      return res.status(400).json({ ok: false, msg: "Age must be a valid number" });
    }

    if (!phone || !prefLang) {
      return res.status(400).json({ ok: false, msg: "Phone and preferred language are required" });
    }

    if (!/^[689]\d{7}$/.test(phone)) {
      return res.status(400).json({ ok: false, msg: "Invalid phone number format" });
    }

    // Role-specific validation
    let elderlyId: number | null = null;

    if (role === "ADMIN") {
      if (!paEmail || !/^[A-Za-z0-9._%+-]+@pa\.gov\.sg$/.test(paEmail)) {
        return res.status(400).json({ ok: false, msg: "Admin must use a valid PA email" });
      }
    }

    if (role === "VOLUNTEER") {
      if (activitiesArray.length === 0 || availabilityArray.length === 0) {
        return res.status(400).json({ ok: false, msg: "Volunteer must provide activities and availability" });
      }
    }

    try {
      // Uniqueness checks
      const emailExists = await pool.query("SELECT 1 FROM users WHERE email = $1", [email]);
      if (emailExists.rows.length > 0) {
        return res.status(400).json({ ok: false, msg: "Email already registered" });
      }

      const nameExists = await pool.query("SELECT 1 FROM users WHERE name = $1", [name]);
      if (nameExists.rows.length > 0) {
        return res.status(400).json({ ok: false, msg: "Name already taken" });
      }

      const hashed = await hashPassword(password);

      // Insert user
      const userResult = await pool.query(
        `INSERT INTO users (name, email, password, role, age, contact_number, preferred_language)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING id, name, email, role, preferred_language`,
        [name, email, hashed, role, age, phone, prefLang]
      );

      const user = userResult.rows[0];

      // Role inserts
      if (role === "ELDERLY") {
        await pool.query(`INSERT INTO elderly (user_id) VALUES ($1)`, [user.id]);
      }

      if (role === "CAREGIVER") {
        await pool.query(`INSERT INTO caregivers (user_id) VALUES ($1)`, [user.id]);
      }

      if (role === "ADMIN") {
        await pool.query(`INSERT INTO admins (user_id, pa_email) VALUES ($1,$2)`, [user.id, paEmail]);
      }

      if (role === "VOLUNTEER") {
        await pool.query(
          `INSERT INTO volunteers (user_id, availability, preferred_activities, location_radius)
           VALUES ($1,$2,$3,$4)`,
          [user.id, availabilityArray, activitiesArray, travelDistance || null]
        );
      }

      return res.json({ ok: true, msg: "User registered successfully", user });

    } catch (err) {
      console.error("Signup error:", err);
      return res.status(500).json({ ok: false, msg: "Database error" });
    }
  },
};
