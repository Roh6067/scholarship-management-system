import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { User } from "../models";

export type AuthRequest = Request & { user?: any };
export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
    if (!token)
      return res.status(401).json({ message: "Authentication required" });
   const secret = process.env.JWT_SECRET;
if (!secret) {
  return res.status(503).json({ message: 'Authentication is not configured on this server' });
}
const payload = jwt.verify(token, secret) as { id: string };
    req.user = await User.findById(payload.id).select("-passwordHash");
    if (!req.user) return res.status(401).json({ message: "Invalid session" });
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired session" });
  }
}
export function allowRoles(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

export const requireAdmin = allowRoles("admin");
