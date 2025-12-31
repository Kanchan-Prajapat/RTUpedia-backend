export const adminAuth = (req, res, next) => {
  const key = req.headers["x-admin-key"];

  if (key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
};
