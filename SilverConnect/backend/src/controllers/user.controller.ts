import { Request, Response } from "express";
import pool from "../db";
import { hashPassword, checkPassword } from "../utils/hash";
export const UserController = {
  
  // ============================
  // Get user by ID
  // ============================
  async getUserById(req: Request, res: Response) {
    const { id } = req.params;

    try {
      // Fetch user basic info
      const userResult = await pool.query(
        `SELECT id, name, age, contact_number, email, preferred_language, role, image_url
        FROM users
        WHERE id = $1`,
        [id]
      );

      if (userResult.rowCount === 0) {
        return res.status(404).json({ ok: false, msg: "User not found" });
      }

      const user = userResult.rows[0];

      // If volunteer, include volunteer-specific data
      if (user.role === "VOLUNTEER") {
        const volunteerResult = await pool.query(
          `SELECT availability, preferred_activities, location_radius
          FROM volunteers
          WHERE user_id = $1`,
          [id]
        );

        if (volunteerResult.rowCount! > 0) {
          const v = volunteerResult.rows[0];
          user.availability = v.availability;
          user.preferred_activities = v.preferred_activities;
          user.location_radius = v.location_radius;
        }
      }

      res.json({ ok: true, user });
    } catch (err) {
      console.error("Error fetching user:", err);
      res.status(500).json({ ok: false, msg: "Internal server error" });
    }
  },

  // ============================
  // Update user profile
  // ============================
  async updateProfile(req: Request, res: Response) {
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    const { id } = req.params;
    const {
      name,
      age,
      contactNumber,
      preferredLanguage,
      availability,
      preferredActivities,
      locationRadius,
      imageUrL,
    } = req.body;

    try {
      // Step 1: Update base user info
      const userResult = await pool.query(
        `UPDATE users
         SET name = $1, age = $2, contact_number = $3, preferred_language = $4, image_url = COALESCE($5, image_url)
         WHERE id = $6
         RETURNING id, name, age, contact_number, email, preferred_language, role, image_url`,
        [name, age, contactNumber, preferredLanguage, imagePath, id]
      );

      if (userResult.rowCount === 0) {
        return res.status(404).json({ ok: false, msg: "User not found" });
      }

      const updatedUser = userResult.rows[0];

      // Step 2: Handle volunteer-specific fields (if applicable)
      if (updatedUser.role === "VOLUNTEER") {
        await pool.query(
          `UPDATE volunteers
           SET availability = $1, preferred_activities = $2, location_radius = $3
           WHERE user_id = $4`,
          [
            availability ? availability.split(",").map((s: string) => s.trim()) : null,
            preferredActivities ? preferredActivities.split(",").map((s: string) => s.trim()) : null,
            locationRadius || null,
            id,
          ]
        );
      }

      res.json({
        ok: true,
        msg: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (err: any) {
      console.error("Error updating profile:", err.message);
      res.status(500).json({ ok: false, msg: "Internal server error" });
    }
  },

  // ============================
  // Reset password
  // ============================
  async resetPassword(req: Request, res: Response) {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    try {
      // Get stored hash
      const userQuery = await pool.query(
        `SELECT password FROM users WHERE id = $1`,
        [id]
      );

      if (userQuery.rowCount === 0) {
        return res.status(404).json({ ok: false, msg: "User not found" });
      }

      const storedHash = userQuery.rows[0].password;

      // Compare old password using bcrypt
      const isValid = await checkPassword(oldPassword, storedHash);
      if (!isValid) {
        return res.status(400).json({ ok: false, msg: "Old password is incorrect" });
      }

      // Hash new password
      const newHash = await hashPassword(newPassword);

      // Update DB
      await pool.query(
        `UPDATE users SET password = $1 WHERE id = $2`,
        [newHash, id]
      );

      return res.json({ ok: true, msg: "Password updated successfully" });

    } catch (err) {
      console.error("Error resetting password:", err);
      return res.status(500).json({ ok: false, msg: "Internal server error" });
    }
  },
};
