import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { Link } from "react-router-dom";
import { Trash2, ExternalLink, Edit, QrCode as QrIcon, X } from "lucide-react";
import QRCode from "qrcode";

export default function Files() {
  const [files, setFiles] = useState<any[]>([]);
  const [editingFile, setEditingFile] = useState<any>(null);
  const [qrModal, setQrModal] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    const res = await axios.get("/files");
    setFiles(res.data);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce fichier ?")) return;
    await axios.delete(`/files/${id}`);
    fetchFiles();
  };

  const handleShowQr = async (slug: string) => {
    const url = `${window.location.origin}/f/${slug}`;
    const dataUrl = await QRCode.toDataURL(url);
    setQrModal(dataUrl);
  };

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Mes Fichiers</h1>
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Titre</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Taille</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Downloads</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {files.map((file) => (
              <tr key={file.id}>
                <td className="px-6 py-4 text-sm font-medium">{file.title}</td>
                <td className="px-6 py-4 text-sm">{(file.fileSize / 1024 / 1024).toFixed(2)} MB</td>
                <td className="px-6 py-4 text-sm">{file.downloadCount}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-3">
                    <button onClick={() => handleShowQr(file.slug)} className="text-gray-600 hover:text-gray-900" title="QR Code">
                      <QrIcon size={20} />
                    </button>
                    <Link to={`/f/${file.slug}`} target="_blank" className="text-blue-600 hover:text-blue-900" title="Voir">
                      <ExternalLink size={20} />
                    </Link>
                    <button onClick={() => setEditingFile(file)} className="text-yellow-600 hover:text-yellow-900" title="Modifier">
                      <Edit size={20} />
                    </button>
                    <button onClick={() => handleDelete(file.id)} className="text-red-600 hover:text-red-900" title="Supprimer">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Modifier le fichier</h2>
              <button onClick={() => setEditingFile(null)}><X /></button>
            </div>
            <EditForm file={editingFile} onComplete={() => { setEditingFile(null); fetchFiles(); }} />
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setQrModal(null)}>
          <div className="rounded-lg bg-white p-6" onClick={e => e.stopPropagation()}>
            <img src={qrModal} alt="QR Code" className="h-64 w-64" />
            <button className="mt-4 w-full rounded bg-blue-600 py-2 text-white" onClick={() => setQrModal(null)}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}

function EditForm({ file, onComplete }: { file: any, onComplete: () => void }) {
  const [title, setTitle] = useState(file.title);
  const [description, setDescription] = useState(file.description || "");
  const [tags, setTags] = useState(file.tags || "");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("tags", tags);
    if (newFile) formData.append("file", newFile);

    try {
      await axios.put(`/files/${file.id}`, formData);
      onComplete();
    } catch (err) {
      alert("Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Titre</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded border p-2" required />
      </div>
      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded border p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">Tags</label>
        <input type="text" value={tags} onChange={e => setTags(e.target.value)} className="w-full rounded border p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">Remplacer le fichier (optionnel)</label>
        <input type="file" onChange={e => e.target.files && setNewFile(e.target.files[0])} className="w-full" />
      </div>
      <button type="submit" disabled={loading} className="w-full rounded bg-blue-600 py-2 text-white disabled:bg-blue-400">
        {loading ? "Mise à jour..." : "Enregistrer"}
      </button>
    </form>
  );
}
