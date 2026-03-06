import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { Download, File as FileIcon, Loader2, AlertCircle, QrCode as QrIcon } from "lucide-react";
import QRCode from "qrcode";

interface PublicFile {
    slug: string;
    title: string;
    description: string | null;
    fileName: string;
    fileSize: number;
    mimeType: string;
    downloadCount: number;
    createdAt: string;
}

const PublicFilesList = () => {
    const [files, setFiles] = useState<PublicFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [qrModal, setQrModal] = useState<{ url: string, title: string } | null>(null);

    useEffect(() => {
        const fetchPublicFiles = async () => {
            try {
                const response = await axios.get(`/files/public`);
                setFiles(response.data);
            } catch (err) {
                setError("Impossible de charger les fichiers.");
            } finally {
                setLoading(false);
            }
        };

        fetchPublicFiles();
    }, []);

    const handleDownload = (slug: string, fileName: string) => {
        // Ideally the backend URL should be an env variable exported from somewhere
        window.location.href = `http://localhost:5000/api/files/download/${slug}`;
    };

    const handleShowQr = async (slug: string, title: string) => {
        const url = `http://localhost:5000/api/files/download/${slug}`;
        const dataUrl = await QRCode.toDataURL(url);
        setQrModal({ url: dataUrl, title: `Télécharger: ${title}` });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200">
                        <h1 className="text-2xl font-bold text-gray-900">Fichiers Partagés</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Liste de tous les fichiers disponibles publiquement.
                        </p>
                    </div>

                    <div className="divide-y divide-gray-200">
                        {files.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 italic">
                                Aucun fichier n'est partagé pour le moment.
                            </div>
                        ) : (
                            files.map((file) => (
                                <div key={file.slug} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-blue-50 bg-opacity-50 text-blue-600 rounded-lg shrink-0">
                                            <FileIcon className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">{file.title}</h3>
                                            {file.description && (
                                                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{file.description}</p>
                                            )}
                                            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                                                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                                    {file.fileName}
                                                </span>
                                                <span>{formatFileSize(file.fileSize)}</span>
                                                <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="sm:shrink-0 flex sm:flex-col justify-end gap-2">
                                        <button
                                            onClick={() => handleShowQr(file.slug, file.title)}
                                            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
                                            title="QR Code pour ce fichier"
                                        >
                                            <QrIcon className="w-4 h-4" />
                                            Scanner
                                        </button>
                                        <button
                                            onClick={() => handleDownload(file.slug, file.fileName)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                            Télécharger
                                        </button>
                                        <span className="text-xs text-gray-400 mt-2 text-right hidden sm:block">
                                            {file.downloadCount} téléchargement{file.downloadCount !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* QR Code Modal */}
            {qrModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setQrModal(null)}>
                    <div className="rounded-lg bg-white p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4 text-center line-clamp-1">{qrModal.title}</h3>
                        <img src={qrModal.url} alt="QR Code" className="h-64 w-64 mx-auto" />
                        <p className="mt-4 text-sm text-gray-500 text-center">
                            Scannez ce QR code pour télécharger directement le fichier.
                        </p>
                        <button
                            className="mt-6 w-full rounded-md bg-blue-600 py-2 text-white font-medium hover:bg-blue-700 transition"
                            onClick={() => setQrModal(null)}
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicFilesList;
