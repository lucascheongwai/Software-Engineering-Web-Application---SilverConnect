import { Request, Response } from "express";
import pool from "../db"; // pg Pool connection

async function elderlyHasCaregiver(elderlyId: number): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM elderly_caregivers WHERE elderly_id = $1 LIMIT 1`,
    [elderlyId]
  );
  return rows.length > 0;
}
export const ActivityController = {
  // GET /activities/:id/volunteers
  async getVolunteersForActivity(req: Request, res: Response) {
    try {
      const activityId = Number(req.params.id);
      if (!activityId) return res.status(400).json({ message: "Missing activity id" });

      const { rows } = await pool.query(
        `SELECT u.id, u.name
        FROM volunteer_activities va
        JOIN users u ON u.id = va.volunteer_id
        WHERE va.activity_id = $1`,
        [activityId]
      );

      return res.json(rows); // [{id, name}]
    } catch (e: any) {
      return res.status(500).json({ message: "Error fetching volunteers", error: e.message });
    }
  },

  // GET /activities/of-elderly/:elderlyId/caregiver
  async getCaregiverForElderly(req: Request, res: Response) {
    try {
      const elderlyId = Number(req.params.elderlyId);
      if (!elderlyId) return res.status(400).json({ message: "Missing elderlyId" });

      const { rows } = await pool.query(
        `SELECT u.id, u.name
        FROM elderly_caregivers ec
        JOIN users u ON u.id = ec.caregiver_id
        WHERE ec.elderly_id = $1`,
        [elderlyId]
      );

      if (rows.length === 0)
        return res.status(404).json({ message: "No caregiver linked" });

      // Return ALL caregivers, not just one
      return res.json(rows);
    } catch (e: any) {
      return res.status(500).json({ message: "Error fetching caregivers", error: e.message });
    }
  },


  async getRegisteredProfilesForActivity(req: Request, res: Response) {
    try {
      const activityId = Number(req.params.id);
      const caregiverId = Number(req.query.caregiverId);

      if (!activityId || !caregiverId) {
        return res
          .status(400)
          .json({ ok: false, message: "Missing activity ID or caregiver ID" });
      }
      // Fetch caregiver name
      const { rows: caregiverRows } = await pool.query(
        `SELECT name FROM users WHERE id = $1`,
        [caregiverId]
      );
      const caregiverName = caregiverRows[0]?.name || "Caregiver";
      // Get linked elderly
      const { rows: elderlyRows } = await pool.query(
        `
        SELECT u.id, u.name
        FROM elderly_caregivers ec
        JOIN users u ON ec.elderly_id = u.id
        WHERE ec.caregiver_id = $1
        `,
        [caregiverId]
      );

      // Check who among caregiver & elderly are registered
      const results: { id: string; name: string; role: string; registered: boolean }[] = [];

      // Caregiver
      const caregiverRegistered = await pool.query(
        `SELECT 1 FROM caregiver_activities WHERE caregiver_id = $1 AND activity_id = $2`,
        [caregiverId, activityId]
      );
      results.push({
        id: `cg-${caregiverId}`,
        name: caregiverName,
        role: "Caregiver",
        registered: caregiverRegistered.rows.length > 0,
      });

      // Each elderly
      for (const e of elderlyRows) {
        const check = await pool.query(
          `SELECT 1 FROM elderly_activities WHERE elderly_id = $1 AND activity_id = $2`,
          [e.id, activityId]
        );
        results.push({
          id: String(e.id),
          name: e.name,
          role: "Elderly",
          registered: check.rows.length > 0,
        });
      }
      // Fetch volunteers registered in this activity
      const { rows: volunteerRows } = await pool.query(
        `
        SELECT u.id, u.name
        FROM volunteer_activities va
        JOIN users u ON va.volunteer_id = u.id
        WHERE va.activity_id = $1
        `,
        [activityId]
      );

      // Add volunteers to results
      for (const v of volunteerRows) {
        results.push({
          id: `v-${v.id}`,
          name: v.name,
          role: "Volunteer",
          registered: true,
        });
      }

    // Apply Role-Based Visibility Rules
    const userRole = String(req.query.role || "").toLowerCase();
    let filteredProfiles = results;

    if (userRole === "elderly") {
      // Elderly registering → show only elderly
      // Elderly deregistering → allow deregistering ANYONE
      if (req.query.action === "register") {
        filteredProfiles = results.filter(p => p.role === "Elderly");
      }
    }

    else if (userRole === "caregiver") {
      // Caregiver registering → Can register caregiver + elderly 
      if (req.query.action === "register") {
        filteredProfiles = results.filter(p =>
          p.role === "Elderly" || p.role === "Caregiver"
        );
      }
    }

    else if (userRole === "volunteer") {
      // Volunteer can only register/deregister themselves
      filteredProfiles = results.filter(p => p.role === "Volunteer");
    }

    return res.status(200).json({ ok: true, profiles: filteredProfiles });

    } catch (error) {
      console.error("[ActivityController] getRegisteredProfilesForActivity error:", error);
      return res.status(500).json({
        ok: false,
        message: "Failed to check registration per profile",
      });
    }
  },

  async getLinkedElderly(req: Request, res: Response) {
    try {
      const caregiverId = Number(req.params.id);

      if (!caregiverId || isNaN(caregiverId)) {
        return res
          .status(400)
          .json({ ok: false, message: "Invalid caregiver ID" });
      }

      const { rows } = await pool.query(
        `
        SELECT 
          u.id, 
          u.name, 
          u.email, 
          u.age, 
          ec.relationship
        FROM elderly_caregivers ec
        JOIN users u ON ec.elderly_id = u.id
        WHERE ec.caregiver_id = $1
        `,
        [caregiverId]
      );

      return res.status(200).json(rows);
    } catch (error) {
      console.error("[ActivityController] getLinkedElderly error:", error);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to fetch linked elderly" });
    }
  },

  async checkVacancy(req: Request, res: Response) {
    try {
      const activityId = Number(req.params.id);
      if (!activityId || isNaN(activityId)) {
        return res.status(400).json({ ok: false, message: "Invalid activity ID" });
      }

      const { rows } = await pool.query(
        `SELECT id, capacity, vacancies FROM activities WHERE id = $1`,
        [activityId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ ok: false, message: "Activity not found" });
      }

      const { capacity, vacancies } = rows[0];
      return res.status(200).json({
        ok: true,
        activityId,
        capacity,
        vacancies,
        hasVacancy: vacancies > 0,
      });
    } catch (error) {
      console.error("[ActivityController] checkVacancy error:", error);
      return res.status(500).json({
        ok: false,
        message: "Failed to check vacancy",
      });
    }
  },

  async isUserRegistered(req: Request, res: Response) {
    try {
      const activityId = Number(req.params.id);
      const { userId, role } = req.query;

      if (!activityId || !userId || !role) {
        return res.status(400).json({ ok: false, message: "Missing parameters" });
      }

      let registered = false;

      if (role === "elderly") {
        // Elderly registered if they are in elderly_activities
        const { rows } = await pool.query(
          `SELECT 1 FROM elderly_activities WHERE elderly_id = $1 AND activity_id = $2`,
          [userId, activityId]
        );
        registered = rows.length > 0;
      }

      else if (role === "caregiver") {
        // Get linked elderly under this caregiver
        const { rows: linked } = await pool.query(
          `SELECT elderly_id FROM elderly_caregivers WHERE caregiver_id = $1`,
          [userId]
        );
        const linkedIds = linked.map((r) => r.elderly_id);

        // If caregiver has no elderly linked, not considered fully registered
        if (linkedIds.length === 0) {
          registered = false;
        } else {
          // Check if caregiver is registered
          const caregiverCheck = await pool.query(
            `SELECT 1 FROM caregiver_activities WHERE caregiver_id = $1 AND activity_id = $2`,
            [userId, activityId]
          );

          // Check how many elderly are registered
          const { rows: elderlyCheck } = await pool.query(
            `SELECT COUNT(*) AS count FROM elderly_activities 
            WHERE activity_id = $1 AND elderly_id = ANY($2::int[])`,
            [activityId, linkedIds]
          );

          const totalElderly = linkedIds.length;
          const registeredElderlyCount = Number(elderlyCheck[0]?.count || 0);

          // Caregiver is "fully registered" only if caregiver + all elderly are registered
          registered =
            caregiverCheck.rows.length > 0 &&
            registeredElderlyCount === totalElderly;
        }
      }

      else if (role === "volunteer") {
        const { rows } = await pool.query(
          `SELECT 1 FROM volunteer_activities WHERE volunteer_id = $1 AND activity_id = $2`,
          [userId, activityId]
        );
        registered = rows.length > 0;
      }

      else {
        return res.status(400).json({ ok: false, message: "Invalid role" });
      }

      return res.status(200).json({ ok: true, registered });
    } catch (error) {
      console.error("[ActivityController] isUserRegistered error:", error);
      return res.status(500).json({
        ok: false,
        message: "Failed to check registration",
      });
    }
  },

  async registerUser(req: Request, res: Response) {
    const client = await pool.connect();
    try {
      const activityId = Number(req.params.id);
      const { role, selectedProfiles, userId } = req.body;

      if (!activityId || !role) {
        return res.status(400).json({
          ok: false,
          message: "Missing role or activity ID",
        });
      }

      await client.query("BEGIN");

      // Lock activity to prevent race condition
      const { rows } = await client.query(
        `SELECT vacancies FROM activities WHERE id = $1 FOR UPDATE`,
        [activityId]
      );

      if (rows.length === 0) throw new Error("Activity not found");

      let vacancies = rows[0].vacancies;
      const numRegistrations =
        role === "caregiver" ? (selectedProfiles?.length || 0) : 1;

      if (vacancies < numRegistrations) {
        throw new Error("Not enough vacancies available");
      }

      const isAlreadyRegistered = async (
        table: string,
        userColumn: string,
        uid: number
      ) => {
        const { rows } = await client.query(
          `SELECT 1 FROM ${table} WHERE ${userColumn} = $1 AND activity_id = $2`,
          [uid, activityId]
        );
        return rows.length > 0;
      };

      let newRegistrations = 0;
      const alreadyRegisteredProfiles: number[] = [];

      // =======================
      // Registration Logic
      // =======================
      if (role === "elderly") {
        if (!userId) throw new Error("Missing elderly userId");

        const already = await isAlreadyRegistered(
          "elderly_activities",
          "elderly_id",
          userId
        );
        if (already) throw new Error("User already registered for this activity");

        await client.query(
          `INSERT INTO elderly_activities (elderly_id, activity_id)
          VALUES ($1, $2)`,
          [userId, activityId]
        );
        newRegistrations = 1;
      }

      else if (role === "caregiver") {
        if (!selectedProfiles?.length) {
          throw new Error("No profiles selected for caregiver registration");
        }

        for (const pid of selectedProfiles) {
          const pidStr = String(pid);
          if (pidStr.startsWith("cg-")) {
            const caregiverId = Number(pidStr.split("-")[1]);
            if (isNaN(caregiverId)) continue;

            const already = await isAlreadyRegistered(
              "caregiver_activities", 
              "caregiver_id",
              caregiverId
            );
            if (already) {
              alreadyRegisteredProfiles.push(caregiverId);
              continue;
            }

            await client.query(
              `INSERT INTO caregiver_activities (caregiver_id, activity_id)
              VALUES ($1, $2)`,
              [caregiverId, activityId]
            );
            newRegistrations++;
          } else {
            const elderlyId = Number(pidStr);
            if (isNaN(elderlyId)) continue;

            const already = await isAlreadyRegistered(
              "elderly_activities",
              "elderly_id",
              elderlyId
            );
            if (already) {
              alreadyRegisteredProfiles.push(elderlyId);
              continue;
            }

            await client.query(
              `INSERT INTO elderly_activities (elderly_id, activity_id)
              VALUES ($1, $2)`,
              [elderlyId, activityId]
            );
            newRegistrations++;
          }
        }
      }

      else if (role === "volunteer") {
        if (!userId) throw new Error("Missing volunteer userId");

        const already = await isAlreadyRegistered(
          "volunteer_activities",
          "volunteer_id",
          userId
        );
        if (already) throw new Error("User already registered for this activity");

        await client.query(
          `INSERT INTO volunteer_activities (volunteer_id, activity_id)
          VALUES ($1, $2)`,
          [userId, activityId]
        );
        newRegistrations = 1;
      }

      else {
        throw new Error("Invalid role");
      }

      // =======================
      // Handle Results
      // =======================
      if (newRegistrations === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          ok: false,
          message:
            alreadyRegisteredProfiles.length > 0
              ? "All selected profiles are already registered for this activity."
              : "No new registrations were made.",
        });
      }

      // Update vacancies only if new registrations occurred
      await client.query(
        `UPDATE activities
        SET vacancies = GREATEST(vacancies - $1, 0)
        WHERE id = $2`,
        [newRegistrations, activityId]
      );

      await client.query("COMMIT");

      let msg = `Successfully registered ${newRegistrations} participant${
        newRegistrations > 1 ? "s" : ""
      }.`;
      if (alreadyRegisteredProfiles.length > 0) {
        msg += ` (${alreadyRegisteredProfiles.length} profile${
          alreadyRegisteredProfiles.length > 1 ? "s were" : " was"
        } already registered)`;
      }

      return res.status(200).json({
        ok: true,
        message: msg,
        activityId,         
        userId,          
        remainingVacancies: vacancies - newRegistrations,
      });

    } catch (error) {
      await client.query("ROLLBACK");
      console.error("[ActivityController] registerUser error:", error);
      return res.status(500).json({
        ok: false,
        message:
          error instanceof Error ? error.message : "Registration failed",
      });
    } finally {
      client.release();
    }
  },
  
  async deregisterUser(req: Request, res: Response) {
    const client = await pool.connect();
    try {
      const activityId = Number(req.params.id);
      const { role, selectedProfiles, userId } = req.body;

      if (!activityId || !role) {
        return res
          .status(400)
          .json({ ok: false, message: "Missing role or activity ID" });
      }

      await client.query("BEGIN");

      // Track how many rows we delete
      let deregisteredCount = 0;

      // Helper for deleting a registration
      const deleteRegistration = async (
        table: string,
        userColumn: string,
        uid: number
      ) => {
        const result = await client.query(
          `DELETE FROM ${table} WHERE ${userColumn} = $1 AND activity_id = $2`,
          [uid, activityId]
        );
        return result.rowCount || 0;
      };

      // =======================
      // Deregistration logic
      // =======================
      if (role === "volunteer") {
        if (!userId) throw new Error("Missing volunteer userId");

        const deleted = await deleteRegistration("volunteer_activities", "volunteer_id", userId);
        deregisteredCount += deleted;
      }
      else if (role === "elderly") {
        // If no selection: elderly is trying to deregister ONLY themselves
        if (!selectedProfiles || selectedProfiles.length === 0) {
          const deleted = await deleteRegistration("elderly_activities", "elderly_id", userId);
          deregisteredCount += deleted;
        } 
        else {
          // Elderly selected profiles → allow deregister ANY role
          for (const pid of selectedProfiles) {
            const pidStr = String(pid);

            if (pidStr.startsWith("cg-")) {
              const caregiverId = Number(pidStr.split("-")[1]);
              deregisteredCount += await deleteRegistration("caregiver_activities", "caregiver_id", caregiverId);
            }
            else if (pidStr.startsWith("v-")) {
              const volunteerId = Number(pidStr.split("-")[1]);
              deregisteredCount += await deleteRegistration("volunteer_activities", "volunteer_id", volunteerId);
            }
            else {
              const elderlyId = Number(pidStr);
              deregisteredCount += await deleteRegistration("elderly_activities", "elderly_id", elderlyId);
            }
          }
        }
      }

      else if (role === "caregiver") {
        if (!selectedProfiles?.length) throw new Error("No profiles selected for deregistration");

        for (const pid of selectedProfiles) {
          const pidStr = String(pid);

          if (pidStr.startsWith("cg-")) {
            const caregiverId = Number(pidStr.split("-")[1]);
            if (!isNaN(caregiverId)) {
              const deleted = await deleteRegistration("caregiver_activities", "caregiver_id", caregiverId);
              deregisteredCount += deleted;
            }
          } else if (pidStr.startsWith("v-")) {
            const volunteerId = Number(pidStr.split("-")[1]);
            if (!isNaN(volunteerId)) {
              const deleted = await deleteRegistration("volunteer_activities", "volunteer_id", volunteerId);
              deregisteredCount += deleted;
            }
          } else {
            const elderlyId = Number(pidStr);
            if (!isNaN(elderlyId)) {
              const deleted = await deleteRegistration("elderly_activities", "elderly_id", elderlyId);
              deregisteredCount += deleted;
            }
          }
        }
      }

      else {
        throw new Error("Invalid role");
      }

      if (deregisteredCount === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          ok: false,
          message: "No registrations found to remove.",
        });
      }

      // Increase vacancies
      await client.query(
        `UPDATE activities
         SET vacancies = LEAST(vacancies + $1, capacity)
         WHERE id = $2`,
        [deregisteredCount, activityId]
      );

      await client.query("COMMIT");

      return res.status(200).json({
        ok: true,
        message: `Successfully deregistered ${deregisteredCount} participant${
          deregisteredCount > 1 ? "s" : ""
        }.`,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("[ActivityController] deregisterUser error:", error);
      return res.status(500).json({
        ok: false,
        message: error instanceof Error ? error.message : "Deregistration failed",
      });
    } finally {
      client.release();
    }
  },


  async getRegisteredActivities(req: Request, res: Response) {
    try {
      const userId = Number(req.params.userId);
      const { role } = req.query;

      if (!userId || isNaN(userId) || !role) {
        return res.status(400).json({ ok: false, message: "Missing user ID or role" });
      }

      let activitiesQuery = "";
      let params: any[] = [];

      if (role === "elderly") {
        activitiesQuery = `
          SELECT a.*, c.name AS community_club_name
          FROM activities a
          JOIN elderly_activities ea ON a.id = ea.activity_id
          LEFT JOIN community_clubs c ON a.community_club_id = c.id
          WHERE ea.elderly_id = $1
          ORDER BY a.date ASC, a.start_time ASC;
        `;
        params = [userId];
      } else if (role === "caregiver") {
        activitiesQuery = `
          SELECT DISTINCT a.*, c.name AS community_club_name
          FROM activities a
          LEFT JOIN community_clubs c ON a.community_club_id = c.id
          LEFT JOIN caregiver_activities ca ON a.id = ca.activity_id
          LEFT JOIN volunteer_activities va ON a.id = va.activity_id
          LEFT JOIN elderly_activities ea ON a.id = ea.activity_id
          LEFT JOIN elderly_caregivers ec ON ec.elderly_id = ea.elderly_id
          WHERE ca.caregiver_id = $1 OR va.volunteer_id = $1 OR ec.caregiver_id = $1
          ORDER BY a.date ASC, a.start_time ASC;
        `;
        params = [userId];
      } else if (role === "volunteer") {
        activitiesQuery = `   
         SELECT a.*, c.name AS community_club_name
         FROM activities a
         JOIN volunteer_activities va ON a.id = va.activity_id
          LEFT JOIN community_clubs c ON a.community_club_id = c.id
         WHERE va.volunteer_id = $1
         ORDER BY a.date ASC, a.start_time ASC;
        `;
        params = [userId];
      }else {
        return res.status(400).json({ ok: false, message: "Invalid role" });
      }

      const { rows } = await pool.query(activitiesQuery, params);

      const formatted = [];
      for (const row of rows) {
        const activityId = row.id;

        const elderlyRes = await pool.query(
          `
          SELECT u.name
          FROM elderly_activities ea
          JOIN users u ON ea.elderly_id = u.id
          WHERE ea.activity_id = $1
          `,
          [activityId]
        );
        
        const caregiverRes = await pool.query(`
          SELECT u.name
          FROM caregiver_activities ca
          JOIN users u ON ca.caregiver_id = u.id
          WHERE ca.activity_id = $1`, [activityId]
        );

        const volunteerRes = await pool.query(
          `
          SELECT u.name
          FROM volunteer_activities va
          JOIN users u ON va.volunteer_id = u.id
          WHERE va.activity_id = $1
          `,
          [activityId]
        );

        const registeredProfiles = [
          ...elderlyRes.rows.map((r) => r.name),
          ...caregiverRes.rows.map((r) => r.name),
          ...volunteerRes.rows.map((r) => r.name),
        ];

        formatted.push({
          activityId,
          name: row.name,
          description: row.description,
          date: row.date,
          start_time: row.start_time,
          end_time: row.end_time,
          capacity: row.capacity,
          vacancies: row.vacancies,
          cost: row.cost,
          location: row.location,
          status: row.status,
          image_url: row.image_url,
          communityClubId: row.community_club_id,
          communityClubName: row.community_club_name,
          registeredProfiles,
        });
      }

      return res.status(200).json(formatted);
    } catch (error) {
      console.error("[ActivityController] getRegisteredActivities error:", error);
      return res.status(500).json({
        ok: false,
        message: "Failed to fetch registered activities",
      });
    }
  },

  async getActivityDetails(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ ok: false, message: "Invalid activity ID" });
      }

      const { rows } = await pool.query(
        `
        SELECT 
          a.*, 
          c.name AS community_club_name
        FROM activities a
        LEFT JOIN community_clubs c ON a.community_club_id = c.id
        WHERE a.id = $1
        `,
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ ok: false, message: "Activity not found" });
      }

      const row = rows[0];

      const activity = {
        activityId: row.id,
        name: row.name,
        description: row.description,
        date: row.date,
        start_time: row.start_time,
        end_time: row.end_time,
        capacity: row.capacity,
        vacancies: row.vacancies,
        cost: row.cost,
        location: row.location,
        status: row.status,
        communityClubId: row.community_club_id,
        communityClubName: row.community_club_name,
        image_url: row.image_url,
      };

      return res.status(200).json(activity);
    } catch (error) {
      console.error("[ActivityController] getActivityDetails error:", error);
      return res.status(500).json({
        ok: false,
        message: "Failed to fetch activity details",
      });
    }
  },

  async getCommunityClubs(_req: Request, res: Response) {
    try {
      const { rows } = await pool.query(
        `SELECT id, name FROM community_clubs ORDER BY name ASC`
      );

      return res.status(200).json(rows);
    } catch (error) {
      console.error("[ActivityController] getCommunityClubs error:", error);
      return res.status(500).json({
        ok: false,
        message: "Failed to fetch community clubs",
      });
    }
  },
  async getAllActivities(req: Request, res: Response) {
    try {
      const { search, location, status, communityClubId, date } = req.query;

      let query = `
        SELECT 
          a.*, 
          c.name AS community_club_name
        FROM activities a
        LEFT JOIN community_clubs c ON a.community_club_id = c.id
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (search) {
        query += ` AND (LOWER(a.name) LIKE LOWER($${paramIndex}) OR LOWER(a.description) LIKE LOWER($${paramIndex + 1}))`;
        params.push(`%${search}%`, `%${search}%`);
        paramIndex += 2;
      }

      if (location) {
        query += ` AND LOWER(a.location) LIKE LOWER($${paramIndex})`;
        params.push(`%${location}%`);
        paramIndex++;
      }

      if (status) {
        query += ` AND a.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (communityClubId) {
        query += ` AND a.community_club_id = $${paramIndex}`;
        params.push(Number(communityClubId));
        paramIndex++;
      }

      if (date) {
        query += ` AND a.date = $${paramIndex}`;
        params.push(date);
        paramIndex++;
      }

      query += ` ORDER BY a.date ASC, a.start_time ASC`;
      const { rows } = await pool.query(query, params);

      const formatted = rows.map((row) => ({
        activityId: row.id,
        name: row.name,
        description: row.description,
        date: row.date,
        start_time: row.start_time,
        end_time: row.end_time,
        capacity: row.capacity,
        vacancies: row.vacancies,
        cost: row.cost,
        location: row.location,
        status: row.status,
        image_url: row.image_url,
        communityClubId: row.community_club_id,
        communityClubName: row.community_club_name,
      }));

      return res.status(200).json(formatted);
    } catch (error) {
      console.error("[ActivityController] getAllActivities error:", error);
      return res.status(500).json({
        ok: false,
        message: "Failed to fetch activities",
      });
    }
  },
};
