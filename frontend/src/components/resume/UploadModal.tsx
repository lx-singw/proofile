"use client";
import React, { useState } from "react";
import { uploadResumeFile } from "@/lib/resumeApi";

export default function UploadModal({ onUploaded }: { onUploaded?: (resumeId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    try {
      const resp = await uploadResumeFile(file);
      if (onUploaded) onUploaded(resp.resume_id);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button className="px-4 py-2 bg-white border rounded" onClick={() => setOpen(true)}>Upload resume</button>
      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded w-96">
            <h3 className="font-bold mb-3">Upload your resume</h3>
            <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-4 py-2" onClick={() => setOpen(false)}>Cancel</button>
              <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleUpload}>{loading ? 'Uploading...' : 'Upload'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
