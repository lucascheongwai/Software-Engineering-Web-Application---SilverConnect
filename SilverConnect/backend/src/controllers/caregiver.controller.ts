import { Request, Response } from "express";
import pool from "../db";

/**
 * Caregiver Controller
 * Handles linking, requests, approvals, and unlinking elderly profiles
 */
const CaregiverController = {
  /**
   * GET /caregivers/elderly/:elderlyId
   * Elderly views all linked caregivers
   */
  async getLinkedCaregivers(req: Request, res: Response) {
    const elderlyId = Number(req.params.elderlyId);

    try {
      const result = await pool.query(
        `SELECT 
            u.id, 
            u.name, 
            u.email,
            u.image_url,
            ec.relationship
        FROM elderly_caregivers ec
        JOIN users u ON ec.caregiver_id = u.id
        WHERE ec.elderly_id = $1`,
        [elderlyId]
      );

      res.json(result.rows); // return *array*
    } catch (err: any) {
      res.status(500).json({ message: "Error fetching caregivers", error: err.message });
    }
  },

  /**
   * POST /caregivers/reject-request
   * Elderly rejects caregiver request
   */
  async rejectRequest(req: Request, res: Response) {
    const { requestId } = req.body;

    try {
      await pool.query(`UPDATE link_requests SET status = 'REJECTED' WHERE id = $1`, [requestId]);
      res.json({ message: "Request rejected." });
    } catch (err: any) {
      res.status(500).json({ message: "Error rejecting request", error: err.message });
    }
  },

  /**
   * POST /caregivers/approve-request
   * Elderly approves caregiver request
   */
  async approveRequest(req: Request, res: Response) {
    const { requestId } = req.body;

    try {
      const request = await pool.query(`SELECT * FROM link_requests WHERE id = $1`, [requestId]);
      if (request.rows.length === 0) return res.status(404).json({ message: "Request not found" });

      const { caregiver_id, elderly_id, relationship } = request.rows[0];

      await pool.query(`
        INSERT INTO elderly_caregivers (caregiver_id, elderly_id, relationship)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
      `, [caregiver_id, elderly_id, relationship]);

      await pool.query(`UPDATE link_requests SET status = 'APPROVED' WHERE id = $1`, [requestId]);

      res.json({ message: "Request approved!" });
    } catch (err: any) {
      res.status(500).json({ message: "Error approving request", error: err.message });
    }
  },

  /**
   * GET /caregivers/:id/link-requests
   * Elderly views pending caregiver link requests
   */
  async getLinkRequests(req: Request, res: Response) {
    const elderlyId = Number(req.params.id);

    try {
      const result = await pool.query(`
        SELECT lr.id, u.name AS caregiver_name, u.email AS caregiver_email, lr.relationship
        FROM link_requests lr
        JOIN users u ON lr.caregiver_id = u.id
        WHERE lr.elderly_id = $1 AND lr.status = 'PENDING'
      `, [elderlyId]);

      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ message: "Error fetching requests", error: err.message });
    }
  },

  /**
   * POST /caregivers/link
   * Caregiver creates a link request to elderly
   */
  async linkElderly(req: Request, res: Response) {
    const { caregiverId, elderlyEmail, relationship } = req.body;

    try {
      if (!caregiverId || !elderlyEmail || !relationship) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const elderlyResult = await pool.query(
        "SELECT id FROM users WHERE email = $1 AND role = 'ELDERLY'",
        [elderlyEmail]
      );

      if (elderlyResult.rows.length === 0) {
        return res.status(404).json({ message: "Elderly not found" });
      }

      const elderlyId = elderlyResult.rows[0].id;

      await pool.query(
        `INSERT INTO link_requests (caregiver_id, elderly_id, relationship)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [caregiverId, elderlyId, relationship]
      );

      res.status(201).json({ message: "Request sent! Awaiting elderly approval." });

    } catch (err: any) {
      console.error("Database error (linkElderly):", err.message);
      res.status(500).json({
        message: "Error linking elderly",
        error: err.message,
      });
    }
  },

  /**
   * GET /caregivers/:id/elderly
   * Caregiver views approved/linked elderly
   */
  async getLinkedElderly(req: Request, res: Response) {
    const caregiverId = Number(req.params.id);

    try {
      const result = await pool.query(
        `SELECT 
            u.id, 
            u.name, 
            u.email,
            u.contact_number, 
            u.age, 
            u.image_url,
            ec.relationship
         FROM elderly_caregivers ec
         JOIN users u ON ec.elderly_id = u.id
         WHERE ec.caregiver_id = $1`,
        [caregiverId]
      );

      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ message: "Error fetching linked elderly", error: err.message });
    }
  },

  /**
   * POST /caregivers/unlink
   * Caregiver unlinks from elderly
   */
  async unlinkElderly(req: Request, res: Response) {
    const { caregiverId, elderlyId } = req.body;

    try {
      if (!caregiverId || !elderlyId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const result = await pool.query(
        `DELETE FROM elderly_caregivers 
         WHERE caregiver_id = $1 AND elderly_id = $2`,
        [caregiverId, elderlyId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "No link found between caregiver and elderly" });
      }

      res.json({ message: "Unlinked successfully!" });
    } catch (err: any) {
      res.status(500).json({ message: "Error unlinking elderly", error: err.message });
    }
  },
};

export default CaregiverController;
