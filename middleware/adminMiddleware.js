export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not logged in" });
  }

  const adminEmails = [
    "rtupedia@gmail.com",
    "manangupta902@gmail.com",
    "kanchanprajapat208@gmail.com",
    "koustubhchouhan9@gmail.com",
    "manangupta9887@gmail.com",
    "mayankphalodia@gmail.com",
    "kanchanprajapat2926@gmail.com"
  ];

  if (!adminEmails.includes(req.user.email.toLowerCase())) {
    return res.status(403).json({ message: "Not authorized" });
  }

  next();
};