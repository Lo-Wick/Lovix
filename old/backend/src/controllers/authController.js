"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.logout = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        let user = await prisma_1.default.user.findUnique({ where: { username } });
        // Seed first user if none exists
        const userCount = await prisma_1.default.user.count();
        if (userCount === 0) {
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            user = await prisma_1.default.user.create({
                data: { username, password: hashedPassword },
            });
        }
        if (!user || !(await bcryptjs_1.default.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, JWT_SECRET, {
            expiresIn: "2h",
        });
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 2 * 60 * 60 * 1000,
        });
        res.json({ message: "Logged in successfully", user: { id: user.id, username: user.username } });
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.login = login;
const logout = (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
};
exports.logout = logout;
const me = async (req, res) => {
    res.json({ user: req.user });
};
exports.me = me;
//# sourceMappingURL=authController.js.map