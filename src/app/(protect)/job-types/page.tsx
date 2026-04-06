"use client";
import { useEffect, useState } from "react";

export type JobType = {
  _id?: string;
  name: string;
  description?: string;
};

export default function JobTypeManager() {
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<JobType | null>(null);

  useEffect(() => {
    fetchJobTypes();
  }, []);

  async function fetchJobTypes() {
    const res = await fetch("/api/job-type");
    setJobTypes(await res.json());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      await fetch("/api/job-type", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: editing._id, name, description }),
      });
    } else {
      await fetch("/api/job-type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
    }
    setName("");
    setDescription("");
    setEditing(null);
    fetchJobTypes();
  }

  async function handleEdit(jobType: JobType) {
    setEditing(jobType);
    setName(jobType.name);
    setDescription(jobType.description || "");
  }

  async function handleDelete(id?: string) {
    if (!id) return;
    if (!confirm("ลบประเภทนี้?")) return;
    await fetch(`/api/job-type?id=${id}`, { method: "DELETE" });
    fetchJobTypes();
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">จัดการประเภทของงาน</h1>
      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <input
          className="border rounded px-2 py-1 w-full"
          placeholder="ชื่อประเภทงาน เช่น Facebook Page"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <textarea
          className="border rounded px-2 py-1 w-full"
          placeholder="รายละเอียด (ถ้ามี)"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-1 rounded"
          type="submit"
        >
          {editing ? "บันทึกการแก้ไข" : "เพิ่มประเภทงาน"}
        </button>
        {editing && (
          <button
            type="button"
            className="ml-2 text-gray-600 underline"
            onClick={() => {
              setEditing(null);
              setName("");
              setDescription("");
            }}
          >
            ยกเลิก
          </button>
        )}
      </form>
      <ul className="space-y-2">
        {jobTypes.map(jt => (
          <li key={jt._id} className="border rounded px-3 py-2 flex justify-between items-center">
            <div>
              <div className="font-semibold">{jt.name}</div>
              {jt.description && <div className="text-sm text-gray-500">{jt.description}</div>}
            </div>
            <div className="space-x-2">
              <button className="text-blue-600" onClick={() => handleEdit(jt)}>แก้ไข</button>
              <button className="text-red-600" onClick={() => handleDelete(jt._id)}>ลบ</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
