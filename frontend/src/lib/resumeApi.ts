import axios from "axios";

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || "" });

export async function createResume(name: string) {
  const resp = await api.post(`/api/v1/resumes`, { name });
  return resp.data;
}

export async function listResumes() {
  const resp = await api.get(`/api/v1/resumes`);
  return resp.data;
}

export async function getResume(id: string) {
  const resp = await api.get(`/api/v1/resumes/${id}`);
  return resp.data;
}

export async function saveResume(id: string, payload: any) {
  const resp = await api.put(`/api/v1/resumes/${id}`, payload);
  return resp.data;
}

export async function optimizeBullet(text: string, context = "") {
  const resp = await api.post(`/api/v1/ai/optimize-bullet`, { text, context }, { responseType: 'stream' as any });
  return resp.data;
}

export async function uploadResumeFile(file: File) {
  const form = new FormData();
  form.append('file', file);
  const resp = await api.post(`/api/v1/resumes/upload`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return resp.data;
}

export async function generatePdf(resume_id: string, template_id: string) {
  const resp = await api.post(`/api/v1/resumes/${resume_id}/generate_pdf`, { template_id });
  return resp.data;
}
