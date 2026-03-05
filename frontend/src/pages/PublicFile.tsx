import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "../api/axios";
import QRCode from "qrcode";
import { Download, FileText } from "lucide-react";

export default function PublicFile() {
  const { slug } = useParams();
  const [file, setFile] = useState<any>(null);
  const [qrCode, setQrCode] = useState("");

  useEffect(() => {
    axios.get(`/files/details/${slug}`).then((res) => {
      setFile(res.data);
      const url = window.location.href;
      QRCode.toDataURL(url).then(setQrCode);
    });
  }, [slug]);

  if (!file) return <div>Loading...</div>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 text-gray-900">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="bg-blue-600 px-8 py-10 text-white">
          <h1 className="text-3xl font-bold">{file.title}</h1>
          <p className="mt-2 opacity-90">{file.description}</p>
        </div>
        <div className="p-8">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="flex items-center space-x-3">
              <FileText className="h-10 w-10 text-blue-500" />
              <div className="text-center">
                <p className="font-bold">{file.fileName}</p>
                <p className="text-sm text-gray-500">{(file.fileSize / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            {qrCode && <img src={qrCode} alt="QR Code" className="h-32 w-32 border p-2" />}
            <a
              href={`http://localhost:5000/api/files/download/${file.slug}`}
              className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 px-6 py-4 text-white hover:bg-blue-700"
            >
              <Download /> <span>Télécharger</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
