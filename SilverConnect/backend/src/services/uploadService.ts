import multer from "multer";
import path from "path";

// Configure storage
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads"), // uploads folder (same level as src)
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter (only images)
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowed = /jpeg|jpg|png|gif/;
  const isValid =
    allowed.test(path.extname(file.originalname).toLowerCase()) &&
    allowed.test(file.mimetype);
  if (isValid) cb(null, true);
  else cb(new Error("Only image files are allowed!"));
};

// Export configured multer instance
export const upload = multer({ storage, fileFilter });
