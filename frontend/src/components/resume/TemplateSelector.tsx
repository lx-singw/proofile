"use client";
import React from "react";
import { ResumeTemplateRead } from "@/types/resume";

export default function TemplateSelector({ templates = [], onSelect }: { templates?: any[], onSelect?: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {templates.map((t: any) => (
        <div key={t.id} className="border rounded p-3">
          <img src={t.preview_image_url} alt={t.name} className="w-full h-36 object-cover mb-2" />
          <div className="flex items-center justify-between">
            <div>{t.name}</div>
            <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => onSelect?.(t.id)}>Select</button>
          </div>
        </div>
      ))}
    </div>
  );
}
