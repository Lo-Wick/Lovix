import { Request, Response } from "express";
interface AuthenticatedRequest extends Request {
    user?: any;
    file?: Express.Multer.File;
}
export declare const uploadFile: (req: AuthenticatedRequest, res: Response) => Promise<any>;
export declare const updateFile: (req: AuthenticatedRequest, res: Response) => Promise<any>;
export declare const listFiles: (req: Request, res: Response) => Promise<void>;
export declare const listPublicFiles: (req: Request, res: Response) => Promise<void>;
export declare const getFileDetails: (req: Request, res: Response) => Promise<any>;
export declare const downloadFile: (req: Request, res: Response) => Promise<any>;
export declare const deleteFile: (req: Request, res: Response) => Promise<any>;
export declare const getStats: (req: Request, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=fileController.d.ts.map