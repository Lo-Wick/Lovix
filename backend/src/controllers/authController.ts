import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export const login = async (req: Request, res: Response): Promise<any> => {
  const { username, password } = req.body;

  try {
    let user = await prisma.user.findUnique({ where: { username } });

    // Seed first user if none exists
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: { username, password: hashedPassword },
      });
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: "2h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 2 * 60 * 60 * 1000,
    });

    res.json({ message: "Logged in successfully", user: { id: user.id, username: user.username } });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
};

export const me = async (req: any, res: Response) => {
  res.json({ user: req.user });
};
