"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createResume, getResume, saveResume } from "@/lib/resumeApi";

const ResumeSchema = z.object({
  name: z.string().min(1),
  data: z.any().optional(),
});

export default function ResumeEditor({ resumeId }: { resumeId?: string }) {
  const { control, handleSubmit, reset } = useForm({ resolver: zodResolver(ResumeSchema), defaultValues: { name: "My Resume", data: {} } });
  const [id, setId] = useState<string | undefined>(resumeId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      getResume(id).then((r) => {
        reset({ name: r.name, data: r.data });
      }).catch(() => {});
    }
  }, [id, reset]);

  async function onSubmit(values: any) {
    setSaving(true);
    try {
      if (!id) {
        const created = await createResume(values.name);
        setId(created.id);
      } else {
        await saveResume(id, values);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Controller name="name" control={control} render={({ field }) => (
          <input {...field} className="w-full px-3 py-2 border rounded" placeholder="Resume name" />
        )} />

        <div>
          <label className="block text-sm font-medium mb-1">Summary</label>
          <Controller name="data" control={control} render={({ field }) => (
            <textarea {...field} className="w-full p-3 border rounded h-40" placeholder="Write a short summary..." />
          )} />
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}
