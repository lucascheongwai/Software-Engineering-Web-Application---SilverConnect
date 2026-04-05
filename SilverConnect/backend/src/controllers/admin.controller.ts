import { Request, Response } from "express";

export const AdminController = {
  createActivity(req: Request, res: Response) {
    return res.json({ ok: true, msg: "Activity created", data: req.body });
  },
  editActivity(req: Request, res: Response) {
    return res.json({ ok: true, msg: "Activity edited", data: req.body });
  },
  deleteActivity(req: Request, res: Response) {
    return res.json({ ok: true, msg: "Activity deleted", id: req.params.id });
  },
  deleteReportedReview(req: Request, res: Response) {
    return res.json({ ok: true, msg: "Reported review deleted", id: req.params.id });
  }
};
