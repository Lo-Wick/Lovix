"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = exports.deleteFile = exports.downloadFile = exports.getFileDetails = exports.listPublicFiles = exports.listFiles = exports.updateFile = exports.uploadFile = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const crypto_1 = __importDefault(require("crypto"));
const storageService_1 = require("../services/storageService");
const uploadFile = async (req, res) => {
    const { title, description, tags } = req.body;
    const file = req.file;
    if (!file || !title) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    try {
        const filePath = await storageService_1.storageService.saveFile(file);
        const slug = crypto_1.default.randomBytes(4).toString("hex");
        const newFile = await prisma_1.default.file.create({
            data: {
                slug,
                title,
                description,
                tags,
                fileName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype,
                filePath: filePath,
            },
        });
        res.status(201).json(newFile);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during upload" });
    }
};
exports.uploadFile = uploadFile;
const updateFile = async (req, res) => {
    const id = req.params.id;
    const { title, description, tags } = req.body;
    const newFile = req.file;
    try {
        const existingFile = await prisma_1.default.file.findUnique({ where: { id } });
        if (!existingFile) {
            return res.status(404).json({ message: "File not found" });
        }
        const updateData = {
            title: title || existingFile.title,
            description: description !== undefined ? description : existingFile.description,
            tags: tags !== undefined ? tags : existingFile.tags,
        };
        if (newFile) {
            await storageService_1.storageService.deleteFile(existingFile.filePath);
            const newPath = await storageService_1.storageService.saveFile(newFile);
            updateData.fileName = newFile.originalname;
            updateData.fileSize = newFile.size;
            updateData.mimeType = newFile.mimetype;
            updateData.filePath = newPath;
        }
        const updatedFile = await prisma_1.default.file.update({
            where: { id },
            data: updateData,
        });
        res.json(updatedFile);
    }
    catch (error) {
        res.status(500).json({ message: "Server error during update" });
    }
};
exports.updateFile = updateFile;
const listFiles = async (req, res) => {
    try {
        const files = await prisma_1.default.file.findMany({
            orderBy: { createdAt: "desc" },
        });
        res.json(files);
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.listFiles = listFiles;
const listPublicFiles = async (req, res) => {
    try {
        const files = await prisma_1.default.file.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                slug: true,
                title: true,
                description: true,
                tags: true,
                fileName: true,
                fileSize: true,
                mimeType: true,
                downloadCount: true,
                createdAt: true,
            }
        });
        res.json(files);
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.listPublicFiles = listPublicFiles;
const getFileDetails = async (req, res) => {
    const slug = req.params.slug;
    try {
        const file = await prisma_1.default.file.findUnique({ where: { slug } });
        if (!file)
            return res.status(404).json({ message: "File not found" });
        res.json(file);
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getFileDetails = getFileDetails;
const downloadFile = async (req, res) => {
    const slug = req.params.slug;
    try {
        const file = await prisma_1.default.file.findUnique({ where: { slug } });
        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }
        const userAgent = req.headers["user-agent"] || "unknown";
        const ip = req.ip || "127.0.0.1";
        const ipHash = crypto_1.default.createHash("sha256").update(ip).digest("hex");
        await prisma_1.default.$transaction([
            prisma_1.default.file.update({
                where: { id: file.id },
                data: { downloadCount: { increment: 1 } },
            }),
            prisma_1.default.downloadLog.create({
                data: {
                    fileId: file.id,
                    userAgent,
                    ipHash,
                },
            }),
        ]);
        const downloadPath = await storageService_1.storageService.getDownloadStream(file.filePath);
        res.download(downloadPath, file.fileName);
    }
    catch (error) {
        res.status(500).json({ message: "Server error during download" });
    }
};
exports.downloadFile = downloadFile;
const deleteFile = async (req, res) => {
    const id = req.params.id;
    try {
        const file = await prisma_1.default.file.findUnique({ where: { id } });
        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }
        await storageService_1.storageService.deleteFile(file.filePath);
        await prisma_1.default.file.delete({ where: { id } });
        res.json({ message: "File deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error during deletion" });
    }
};
exports.deleteFile = deleteFile;
const getStats = async (req, res) => {
    try {
        const fileCount = await prisma_1.default.file.count();
        const totalDownloads = await prisma_1.default.file.aggregate({
            _sum: { downloadCount: true }
        });
        res.json({
            fileCount,
            totalDownloads: totalDownloads._sum.downloadCount || 0
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getStats = getStats;
//# sourceMappingURL=fileController.js.map