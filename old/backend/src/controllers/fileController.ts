import { Request, Response } from "express";
import prisma from "../lib/prisma";
import crypto from "crypto";
import { storageService } from "../services/storageService";

interface AuthenticatedRequest extends Request {
  user?: any;
  file?: Express.Multer.File;
}

export const uploadFile = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  const { title, description, tags } = req.body;
  const file = req.file;

  if (!file || !title) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const filePath = await storageService.saveFile(file);
    const slug = crypto.randomBytes(4).toString("hex");

    const newFile = await prisma.file.create({
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during upload" });
  }
};

export const updateFile = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  const id = req.params.id as string;
  const { title, description, tags } = req.body;
  const newFile = req.file;

  try {
    const existingFile = await prisma.file.findUnique({ where: { id } });
    if (!existingFile) {
      return res.status(404).json({ message: "File not found" });
    }

    const updateData: any = {
      title: title || existingFile.title,
      description: description !== undefined ? description : existingFile.description,
      tags: tags !== undefined ? tags : existingFile.tags,
    };

    if (newFile) {
      await storageService.deleteFile(existingFile.filePath);
      const newPath = await storageService.saveFile(newFile);

      updateData.fileName = newFile.originalname;
      updateData.fileSize = newFile.size;
      updateData.mimeType = newFile.mimetype;
      updateData.filePath = newPath;
    }

    const updatedFile = await prisma.file.update({
      where: { id },
      data: updateData,
    });

    res.json(updatedFile);
  } catch (error) {
    res.status(500).json({ message: "Server error during update" });
  }
};

export const listFiles = async (req: Request, res: Response) => {
  try {
    const files = await prisma.file.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const listPublicFiles = async (req: Request, res: Response) => {
  try {
    const files = await prisma.file.findMany({
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
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getFileDetails = async (req: Request, res: Response): Promise<any> => {
  const slug = req.params.slug as string;
  try {
    const file = await prisma.file.findUnique({ where: { slug } });
    if (!file) return res.status(404).json({ message: "File not found" });
    res.json(file);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export const downloadFile = async (req: Request, res: Response): Promise<any> => {
  const slug = req.params.slug as string;

  try {
    const file = await prisma.file.findUnique({ where: { slug } });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    const userAgent = req.headers["user-agent"] || "unknown";
    const ip = req.ip || "127.0.0.1";
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

    await prisma.$transaction([
      prisma.file.update({
        where: { id: file.id },
        data: { downloadCount: { increment: 1 } },
      }),
      prisma.downloadLog.create({
        data: {
          fileId: file.id,
          userAgent,
          ipHash,
        },
      }),
    ]);

    const downloadPath = await storageService.getDownloadStream(file.filePath);
    res.download(downloadPath, file.fileName);
  } catch (error) {
    res.status(500).json({ message: "Server error during download" });
  }
};

export const deleteFile = async (req: Request, res: Response): Promise<any> => {
  const id = req.params.id as string;

  try {
    const file = await prisma.file.findUnique({ where: { id } });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    await storageService.deleteFile(file.filePath);
    await prisma.file.delete({ where: { id } });

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error during deletion" });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const fileCount = await prisma.file.count();
    const totalDownloads = await prisma.file.aggregate({
      _sum: { downloadCount: true }
    });
    res.json({
      fileCount,
      totalDownloads: totalDownloads._sum.downloadCount || 0
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}
