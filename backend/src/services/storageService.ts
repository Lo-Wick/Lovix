import fs from "fs/promises";
import path from "path";

export interface IStorageService {
  saveFile(file: Express.Multer.File): Promise<string>;
  deleteFile(filePath: string): Promise<void>;
  getDownloadStream(filePath: string): Promise<any>;
}

export class LocalStorageService implements IStorageService {
  async saveFile(file: Express.Multer.File): Promise<string> {
    // Multer already saved the file to 'uploads/'
    return file.path;
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (e) {
      console.error("Local storage: File not found for deletion", filePath);
    }
  }

  async getDownloadStream(filePath: string): Promise<any> {
    return filePath; // For res.download()
  }
}

// Mock S3 Storage Service for demonstration as the second option
export class S3StorageService implements IStorageService {
  async saveFile(file: Express.Multer.File): Promise<string> {
    console.log(`[S3 Storage] Uploading ${file.originalname} to S3 bucket...`);
    // In a real implementation:
    // const params = { Bucket: 'my-bucket', Key: file.filename, Body: file.buffer };
    // const data = await s3.upload(params).promise();
    // return data.Location;
    return `s3://mock-bucket/${file.filename}`;
  }

  async deleteFile(filePath: string): Promise<void> {
    console.log(`[S3 Storage] Deleting ${filePath} from S3...`);
  }

  async getDownloadStream(filePath: string): Promise<any> {
    console.log(`[S3 Storage] Getting signed URL for ${filePath}`);
    return filePath;
  }
}

const storageType = process.env.STORAGE_TYPE || "local";
export const storageService = storageType === "s3" ? new S3StorageService() : new LocalStorageService();
