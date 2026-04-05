import { Request, Response } from "express";
import pool from "../db"; // pg Pool connection

export const VolunteerController = {
  // Get activities a volunteer has registered for (approved requests)
  async getVolunteerActivities(req: Request, res: Response) {
    try {
      const volunteerId = Number(req.params.volunteerId);

      if (!volunteerId || isNaN(volunteerId)) {
        return res.status(400).json({ 
          ok: false, 
          message: "Invalid volunteer ID" 
        });
      }

      const { rows } = await pool.query(
        `SELECT 
          a.id AS activity_id,
          a.name,
          a.description,
          a.date,
          a.start_time,
          a.end_time,
          a.location,
          a.cost,
          a.status,
          a.image_url,
          c.name AS community_club_name
        FROM volunteer_activities va
        JOIN activities a ON va.activity_id = a.id
        LEFT JOIN community_clubs c ON a.community_club_id = c.id
        WHERE va.volunteer_id = $1
        ORDER BY a.date ASC, a.start_time ASC`,
        [volunteerId]
      );

      return res.status(200).json(rows);

    } catch (error) {
      console.error("[VolunteerController] getVolunteerActivities error:", error);
      return res.status(500).json({ 
        ok: false, 
        message: "Failed to fetch volunteer activities" 
      });
    }
  },

  // Get volunteer's pending join requests
  async getVolunteerPendingRequests(req: Request, res: Response) {
    try {
      const volunteerId = Number(req.params.volunteerId);

      if (!volunteerId || isNaN(volunteerId)) {
        return res.status(400).json({ 
          ok: false, 
          message: "Invalid volunteer ID" 
        });
      }

      const { rows } = await pool.query(
        `SELECT 
          vjr.id AS request_id,
          vjr.status,
          vjr.message,
          vjr.created_at,
          a.id AS activity_id,
          a.name AS activity_name,
          a.date,
          a.start_time,
          a.end_time,
          a.location,
          u.name AS elderly_name
        FROM volunteer_join_requests vjr
        JOIN activities a ON vjr.activity_id = a.id
        JOIN users u ON vjr.elderly_id = u.id
        WHERE vjr.volunteer_id = $1
        ORDER BY 
          CASE vjr.status 
            WHEN 'PENDING' THEN 1 
            WHEN 'APPROVED' THEN 2 
            WHEN 'REJECTED' THEN 3 
          END,
          vjr.created_at DESC`,
        [volunteerId]
      );

      return res.status(200).json(rows);

    } catch (error) {
      console.error("[VolunteerController] getVolunteerActivities error:", error);
      return res.status(500).json({ 
        ok: false, 
        message: "Failed to fetch volunteer requests" 
      });
    }
  },

  async requestJoinWithApproval(req: Request, res: Response) {
    try {
      const activityId = Number(req.params.id);
      const { volunteerId, elderlyId, message } = req.body;

      // Validate inputs
      if (!activityId || isNaN(activityId)) {
        return res.status(400).json({ 
          ok: false, 
          message: "Invalid activity ID" 
        });
      }

      if (!volunteerId || !elderlyId) {
        return res.status(400).json({ 
          ok: false, 
          message: "Volunteer ID and Elderly ID are required" 
        });
      }

      const volId = Number(volunteerId);
      const eldId = Number(elderlyId);

      // Check if volunteer exists
      const volunteerCheck = await pool.query(
        `SELECT id, role FROM users WHERE id = $1 AND role = 'VOLUNTEER'`,
        [volId]
      );

      if (volunteerCheck.rows.length === 0) {
        return res.status(404).json({ 
          ok: false, 
          message: "Volunteer not found" 
        });
      }

      // Check if elderly exists and is registered for this activity
      const elderlyCheck = await pool.query(
        `SELECT u.id 
         FROM users u
         JOIN elderly_activities ea ON u.id = ea.elderly_id
         WHERE u.id = $1 AND u.role = 'ELDERLY' AND ea.activity_id = $2`,
        [eldId, activityId]
      );

      if (elderlyCheck.rows.length === 0) {
        return res.status(404).json({ 
          ok: false, 
          message: "Elderly user not found or not registered for this activity" 
        });
      }

      // Check if activity exists and has vacancies
      const activityCheck = await pool.query(
        `SELECT id, name, vacancies, status FROM activities WHERE id = $1`,
        [activityId]
      );

      if (activityCheck.rows.length === 0) {
        return res.status(404).json({ 
          ok: false, 
          message: "Activity not found" 
        });
      }

      const activity = activityCheck.rows[0];

      if (activity.status !== 'Open') {
        return res.status(400).json({ 
          ok: false, 
          message: "Activity is not open for registration" 
        });
      }

      if (activity.vacancies <= 0) {
        return res.status(400).json({ 
          ok: false, 
          message: "No vacancies available for this activity" 
        });
      }

      // Check if request already exists
      const existingRequest = await pool.query(
        `SELECT id, status FROM volunteer_join_requests 
         WHERE volunteer_id = $1 AND activity_id = $2 AND elderly_id = $3`,
        [volId, activityId, eldId]
      );

      // Check if previous request exists
      if (existingRequest.rows.length > 0) {
        const { status, id: requestId } = existingRequest.rows[0];

        // If APPROVED before, check if volunteer is still currently registered
        const currentlyRegistered = await pool.query(
          `SELECT 1 FROM volunteer_activities 
          WHERE volunteer_id = $1 AND activity_id = $2`,
          [volId, activityId]
        );

        if (status === 'APPROVED' && currentlyRegistered.rows.length === 0) {
          // Volunteer was approved before, but is no longer registered → allow new attempt
          await pool.query(
            `UPDATE volunteer_join_requests 
            SET status = 'PENDING', message = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2`,
            [message || null, requestId]
          );

          return res.status(200).json({
            ok: true,
            message: "Request re-submitted successfully",
            activityId,
            volunteerId: volId,
            elderlyId: eldId
          });
        }

        // Otherwise block repeat requests
        return res.status(400).json({ 
          ok: false, 
          message: `Request already ${status.toLowerCase()}` 
        });
      }

      // Create join request
      await pool.query(
        `INSERT INTO volunteer_join_requests 
         (volunteer_id, activity_id, elderly_id, status, message) 
         VALUES ($1, $2, $3, 'PENDING', $4)`,
        [volId, activityId, eldId, message || null]
      );

      return res.status(200).json({ 
        ok: true, 
        message: "Join request sent successfully",
        activityId,
        volunteerId: volId,
        elderlyId: eldId
      });

    } catch (error) {
      console.error("[VolunteerController] requestJoinWithApproval error:", error);
      return res.status(500).json({ 
        ok: false, 
        message: "Failed to send join request" 
      });
    }
  },

  // NEW: Get pending requests for an elderly user
  async getPendingRequests(req: Request, res: Response) {
    try {
      const elderlyId = Number(req.params.elderlyId);

      if (!elderlyId || isNaN(elderlyId)) {
        return res.status(400).json({ 
          ok: false, 
          message: "Invalid elderly ID" 
        });
      }

      const { rows } = await pool.query(
        `SELECT 
          vjr.id,
          vjr.volunteer_id,
          vjr.activity_id,
          vjr.status,
          vjr.message,
          vjr.created_at,
          u.name AS volunteer_name,
          u.email AS volunteer_email,
          u.image_url AS volunteer_image_url,
          a.name AS activity_name,
          a.date AS activity_date,
          a.start_time,
          a.end_time
         FROM volunteer_join_requests vjr
         JOIN users u ON vjr.volunteer_id = u.id
         JOIN activities a ON vjr.activity_id = a.id
         WHERE vjr.elderly_id = $1 AND vjr.status = 'PENDING'
         ORDER BY vjr.created_at DESC`,
        [elderlyId]
      );

      return res.status(200).json(rows);

    } catch (error) {
      console.error("[VolunteerController] getPendingRequests error:", error);
      return res.status(500).json({ 
        ok: false, 
        message: "Failed to fetch pending requests" 
      });
    }
  },

  // NEW: Elderly approves or rejects volunteer request
  async handleJoinRequest(req: Request, res: Response) {
    try {
      const requestId = Number(req.params.requestId);
      const { action, elderlyId } = req.body; // action: 'APPROVED' or 'REJECTED'

      if (!requestId || isNaN(requestId)) {
        return res.status(400).json({ 
          ok: false, 
          message: "Invalid request ID" 
        });
      }

      if (!action || !['APPROVED', 'REJECTED'].includes(action)) {
        return res.status(400).json({ 
          ok: false, 
          message: "Invalid action. Must be APPROVED or REJECTED" 
        });
      }

      // Get request details
      const requestCheck = await pool.query(
        `SELECT * FROM volunteer_join_requests 
         WHERE id = $1 AND elderly_id = $2 AND status = 'PENDING'`,
        [requestId, elderlyId]
      );

      if (requestCheck.rows.length === 0) {
        return res.status(404).json({ 
          ok: false, 
          message: "Request not found or already processed" 
        });
      }

      const request = requestCheck.rows[0];

      // Update request status
      await pool.query(
        `UPDATE volunteer_join_requests 
         SET status = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [action, requestId]
      );

      // If approved, add volunteer to activity
      if (action === 'APPROVED') {
        // Check if volunteer is already registered
        const alreadyRegistered = await pool.query(
          `SELECT 1 FROM volunteer_activities 
           WHERE volunteer_id = $1 AND activity_id = $2`,
          [request.volunteer_id, request.activity_id]
        );

        if (alreadyRegistered.rows.length === 0) {
          // Add volunteer to activity
          await pool.query(
            `INSERT INTO volunteer_activities (volunteer_id, activity_id) 
             VALUES ($1, $2)`,
            [request.volunteer_id, request.activity_id]
          );

          // Decrease vacancy
          await pool.query(
            `UPDATE activities 
             SET vacancies = GREATEST(vacancies - 1, 0) 
             WHERE id = $1`,
            [request.activity_id]
          );
        }
      }

      return res.status(200).json({ 
        ok: true, 
        message: `Request ${action.toLowerCase()} successfully`,
        requestId,
        action
      });

    } catch (error) {
      console.error("[VolunteerController] handleJoinRequest error:", error);
      return res.status(500).json({ 
        ok: false, 
        message: "Failed to process request" 
      });
    }
  },

  // NEW: Get all elderly users registered for an activity
  async getActivityElderly(req: Request, res: Response) {
    try {
      const activityId = Number(req.params.id);

      if (!activityId || isNaN(activityId)) {
        return res.status(400).json({ 
          ok: false, 
          message: "Invalid activity ID" 
        });
      }

      const { rows } = await pool.query(
        `SELECT 
          u.id,
          u.name,
          u.email
         FROM users u
         JOIN elderly_activities ea ON u.id = ea.elderly_id
         WHERE ea.activity_id = $1 AND u.role = 'ELDERLY'
         ORDER BY u.name ASC`,
        [activityId]
      );

      return res.status(200).json(rows);

    } catch (error) {
      console.error("[VolunteerController] getActivityElderly error:", error);
      return res.status(500).json({ 
        ok: false, 
        message: "Failed to fetch elderly users" 
      });
    }
  },

  async cancelJoinRequest(req: Request, res: Response) {
    try {
      const activityId = Number(req.params.id);
      const { volunteerId } = req.body;

      if (!activityId || isNaN(activityId)) {
        return res.status(400).json({ 
          ok: false, 
          message: "Invalid activity ID" 
        });
      }

      if (!volunteerId || isNaN(Number(volunteerId))) {
        return res.status(400).json({ 
          ok: false, 
          message: "Invalid volunteer ID" 
        });
      }

      const volId = Number(volunteerId);

      // Check if volunteer exists
      const volunteerCheck = await pool.query(
        `SELECT id FROM users WHERE id = $1 AND role = 'VOLUNTEER'`,
        [volId]
      );

      if (volunteerCheck.rows.length === 0) {
        return res.status(404).json({ 
          ok: false, 
          message: "Volunteer not found" 
        });
      }

      // Check if activity exists
      const activityCheck = await pool.query(
        `SELECT id, name FROM activities WHERE id = $1`,
        [activityId]
      );

      if (activityCheck.rows.length === 0) {
        return res.status(404).json({ 
          ok: false, 
          message: "Activity not found" 
        });
      }

      // Delete from volunteer_activities if registered
      const deleteResult = await pool.query(
        `DELETE FROM volunteer_activities 
         WHERE volunteer_id = $1 AND activity_id = $2
         RETURNING *`,
        [volId, activityId]
      );

      // Also delete any pending requests
      await pool.query(
        `DELETE FROM volunteer_join_requests 
         WHERE volunteer_id = $1 AND activity_id = $2 AND status = 'PENDING'`,
        [volId, activityId]
      );

      if (deleteResult.rows.length > 0) {
        // Increase vacancy count if was registered
        await pool.query(
          `UPDATE activities 
           SET vacancies = vacancies + 1 
           WHERE id = $1`,
          [activityId]
        );
      }

      return res.status(200).json({ 
        ok: true, 
        message: "Successfully cancelled registration/request",
        activityId,
        volunteerId: volId
      });

    } catch (error) {
      console.error("[VolunteerController] cancelJoinRequest error:", error);
      return res.status(500).json({ 
        ok: false, 
        message: "Failed to cancel registration" 
      });
    }
  },
};
