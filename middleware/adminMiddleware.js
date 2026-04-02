export const adminOnly = (req, res, next) => {
  const user = req.user; // JWT se aata hai

  if (!user) {
    return res.status(401).json({ message: "Not logged in" });
  }

  if (!["rtupedia@gmail.com", "manangupta902@gmail.com", "kanchanprajapat208@gmail.com", "koustubhchouhan9@gmail.com", "manangupta9887@gmail.com", "kanchanprajapat2926@gmail.com"].includes(user.email)) {
    return res.status(403).json({ message: "Not authorized" });
  }

  next();
};