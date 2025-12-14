"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchAdminCurricula,
  createCurriculum,
  updateCurriculum,
  deleteCurriculum,
  fetchFaculties,
  fetchPrograms,
  type CurriculumDTO,
  type FacultyDTO,
  type ProgramDTO,
} from "@/services/curriculum";

type FormState = {
  id?: number;
  code: string;
  name: string;
  related_documents: string;
  link: string;
  gpax_min: string;
  faculty_id: string;
  program_id: string;
  status: string;
  start_date: string;
  end_date: string;
  quota: string;
};

const emptyForm: FormState = {
  code: "",
  name: "",
  related_documents: "",
  link: "",
  gpax_min: "2.50",
  faculty_id: "",
  program_id: "",
  status: "",
  start_date: "",
  end_date: "",
  quota: "",
};

export default function AdminCurriculaPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<CurriculumDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [faculties, setFaculties] = useState<FacultyDTO[]>([]);
  const [programs, setPrograms] = useState<ProgramDTO[]>([]);

  // ---------- Check auth ----------
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      if (!token || !userStr) {
        router.push("/login");
        return;
      }
      const user = JSON.parse(userStr);
      if (user.type_id !== 3) {
        alert("No permission");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
        return;
      }
      setIsAuthorized(true);
    } catch (err) {
      router.push("/login");
    }
  }, [router]);

  // ---------- Load Data (ฟังก์ชันหลัก) ----------
  async function loadData() {
    try {
      setLoading(true);
      const data = await fetchAdminCurricula(search);
      setItems(data);
    } catch (err) {
      console.error(err);
      // alert("โหลดข้อมูลหลักสูตรไม่สำเร็จ"); // ปิด alert ตอนพิมพ์ค้นหาเพื่อให้ดูสมูทขึ้น
    } finally {
      setLoading(false);
    }
  }

  // ✅ Real-time Search Effect (Debounce)
  useEffect(() => {
    if (!isAuthorized) return;

    // ตั้งเวลาหน่วง 500ms (0.5 วินาที) หลังจากพิมพ์เสร็จค่อยค้นหา
    const delayDebounceFn = setTimeout(() => {
      loadData();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, isAuthorized]); // ทำงานเมื่อ search หรือ isAuthorized เปลี่ยน

  async function loadFaculties() {
    try {
      const data = await fetchFaculties();
      const normalized: FacultyDTO[] = (data as any[]).map((f) => ({
        id: f.id ?? f.ID,
        name: f.name ?? f.Name,
        short_name: f.short_name ?? f.ShortName,
      }));
      setFaculties(normalized);
    } catch (err) {
      console.error("โหลดสำนักวิชาล้มเหลว:", err);
    }
  }

  async function loadProgramsByFaculty(facultyId: number) {
    try {
      const data = await fetchPrograms(facultyId);
      const normalized: ProgramDTO[] = (data as any[]).map((p) => ({
        id: p.id ?? p.ID,
        name: p.name ?? p.Name,
        short_name: p.short_name ?? p.ShortName,
      }));
      setPrograms(normalized);
    } catch (err) {
      console.error("โหลดสาขาวิชาล้มเหลว:", err);
    }
  }

  // โหลด Dropdown แค่ครั้งเดียวตอนเข้ามา
  useEffect(() => {
    if (isAuthorized) {
      loadFaculties();
    }
  }, [isAuthorized]);

  function openNewForm() {
    setForm(emptyForm);
    setPrograms([]);
    setShowForm(true);
  }

  function openEditForm(cur: CurriculumDTO) {
    const anyCur = cur as any;
    const facultyIdStr = cur.faculty?.id ? String(cur.faculty.id) : "";
    const programIdStr = cur.program?.id ? String(cur.program.id) : "";

    let sDate = "";
    let eDate = "";
    const periodStr = anyCur.application_period || "";
    if (periodStr.includes("|")) {
      const parts = periodStr.split("|");
      sDate = parts[0] || "";
      eDate = parts[1] || "";
    }

    setForm({
      id: cur.id,
      code: cur.code ?? "",
      name: cur.name ?? "",
      related_documents: cur.description ?? "",
      link: anyCur.link ?? "",
      gpax_min: String(cur.gpax_min ?? ""),
      faculty_id: facultyIdStr,
      program_id: programIdStr,
      status: cur.status ?? "",
      start_date: sDate,
      end_date: eDate,
      quota: anyCur.quota !== undefined && anyCur.quota !== null ? String(anyCur.quota) : "",
    });

    if (facultyIdStr) {
      loadProgramsByFaculty(Number(facultyIdStr));
    } else {
      setPrograms([]);
    }
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (!form.faculty_id || !form.program_id) {
        alert("กรุณาเลือกสำนักวิชาและสาขาวิชา");
        setSaving(false);
        return;
      }

      const userStr = localStorage.getItem("user");
      let userId = 0;
      if (userStr) {
        const user = JSON.parse(userStr);
        userId = user.id ?? user.ID ?? user.user_id ?? 0;
      }

      const combinedPeriod = `${form.start_date}|${form.end_date}`;

      const payload = {
        code: form.code,
        name: form.name,
        description: form.related_documents,
        link: form.link,
        gpax_min: parseFloat(form.gpax_min || "0"),
        portfolio_max_pages: 0,
        faculty_id: Number(form.faculty_id),
        program_id: Number(form.program_id),
        status: form.status,
        user_id: userId,
        application_period: combinedPeriod,
        quota: parseInt(form.quota || "0", 10),
      };

      if (form.id) {
        await updateCurriculum(form.id, payload);
      } else {
        await createCurriculum(payload);
      }

      setShowForm(false);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("บันทึกหลักสูตรไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id?: number) {
    if (!id || !confirm("ต้องการลบหลักสูตรนี้หรือไม่?")) return;
    try {
      await deleteCurriculum(id);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("ลบหลักสูตรไม่สำเร็จ");
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "open":
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 border border-green-200">
            🟢 เปิดอยู่
          </span>
        );
      case "opening":
        return (
          <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800 border border-orange-200">
            🟠 กำลังเปิด
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 border border-red-200">
            🔴 ปิดแล้ว
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-black border border-gray-200">
            ⚪ ไม่มีสถานะ
          </span>
        );
    }
  }

  function formatPeriodDisplay(period: string) {
    if (!period) return "-";
    if (period.includes("|")) {
      const [start, end] = period.split("|");
      const fmt = (d: string) => d ? new Date(d).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '?';
      return `${fmt(start)} - ${fmt(end)}`;
    }
    return period;
  }

  if (!isAuthorized) return null;

  return (
    <div className="p-8">
      <header className="bg-orange-500 text-white px-6 py-4 rounded-t-lg shadow max-w-6xl">
        <h1 className="text-xl font-bold">ระบบจัดการข้อมูลหลักสูตร</h1>
      </header>

      <section className="bg-white border border-orange-200 border-t-0 rounded-b-lg p-6 max-w-6xl space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              // onKeyDown เดิมอาจจะไม่จำเป็นแล้ว แต่ใส่ไว้ก็ไม่เสียหาย
              placeholder="ค้นหาชื่อ/รหัสหลักสูตร"
              className="rounded border border-gray-300 px-3 py-2 min-w-[260px] text-black placeholder-gray-500 focus:ring-2 focus:ring-orange-400 focus:outline-none"
            />
            <button
              onClick={loadData}
              className="rounded bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
            >
              🔍 ค้นหา
            </button>
          </div>
          <button
            onClick={openNewForm}
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            [+ เพิ่มหลักสูตร]
          </button>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="min-w-full text-xs md:text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-black font-bold">
                <th className="border px-2 py-2">สำนักวิชา</th>
                <th className="border px-2 py-2">สาขาวิชา</th>
                <th className="border px-2 py-2">โครงการ</th>
                <th className="border px-2 py-2">GPAX</th>
                <th className="border px-2 py-2">เอกสารที่เกี่ยวข้อง</th>
                <th className="border px-2 py-2">ช่วงเวลาการรับสมัคร</th>
                <th className="border px-2 py-2">จำนวนรับ</th>
                <th className="border px-2 py-2 text-center">สถานะ</th>
                <th className="border px-2 py-2 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="text-black">
              {!loading && items.length === 0 && (
                <tr><td colSpan={9} className="border p-4 text-center text-black">ไม่มีข้อมูล</td></tr>
              )}
              {items.map((c, idx) => (
                <tr key={c.id ?? idx} className="hover:bg-gray-50">
                  <td className="border px-2 py-1">{c.faculty?.name}</td>
                  <td className="border px-2 py-1">{c.program?.name}</td>
                  <td className="border px-2 py-1">
                    <div className="font-semibold">{c.code}</div>
                    <div className="text-xs text-black">{c.name}</div>
                  </td>
                  <td className="border px-2 py-1 text-center">{c.gpax_min?.toFixed(2)}</td>
                  <td className="border px-2 py-1">{c.description || "-"}</td>
                  <td className="border px-2 py-1 text-xs">
                    {(c as any).application_period ? formatPeriodDisplay((c as any).application_period) : "-"}
                  </td>
                  <td className="border px-2 py-1 text-center">{(c as any).quota ?? "-"}</td>
                  <td className="border px-2 py-1 text-center">
                    {getStatusBadge(c.status || "")}
                  </td>
                  <td className="border px-2 py-1 text-center space-x-2">
                    {(c as any).link ? (
                      <a 
                        href={(c as any).link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-semibold"
                      >
                         👁 ดูรายละเอียด
                      </a>
                    ) : (
                      <span className="text-gray-400 font-semibold cursor-not-allowed">👁 ดูรายละเอียด</span>
                    )}

                    <div className="inline-block border-l border-gray-300 h-4 mx-1 align-middle"></div>

                    <button onClick={() => openEditForm(c)} className="text-yellow-600 hover:underline font-semibold">✏ แก้ไข</button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline font-semibold">🗑 ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4 text-black border-b pb-2">
              {form.id ? "แก้ไขหลักสูตร" : "เพิ่มหลักสูตรใหม่"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-black">รหัสหลักสูตร <span className="text-red-500">*</span></label>
                  <input
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-orange-200 outline-none text-black"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-black">ชื่อโครงการ <span className="text-red-500">*</span></label>
                  <input
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-orange-200 outline-none text-black"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-black">สำนักวิชา <span className="text-red-500">*</span></label>
                  <select
                    className="w-full border rounded px-3 py-2 outline-none text-black"
                    value={form.faculty_id}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm({ ...form, faculty_id: val, program_id: "" });
                      if (val) loadProgramsByFaculty(Number(val));
                      else setPrograms([]);
                    }}
                  >
                    <option value="">-- เลือก --</option>
                    {faculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-black">สาขาวิชา <span className="text-red-500">*</span></label>
                  <select
                    className="w-full border rounded px-3 py-2 outline-none text-black"
                    value={form.program_id}
                    onChange={(e) => setForm({ ...form, program_id: e.target.value })}
                    disabled={!form.faculty_id}
                  >
                    <option value="">-- เลือก --</option>
                    {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-black">GPAX ขั้นต่ำ</label>
                  <input
                    type="number" step="0.01"
                    className="w-full border rounded px-3 py-2 outline-none text-black"
                    value={form.gpax_min}
                    onChange={(e) => setForm({ ...form, gpax_min: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-black">เอกสารที่เกี่ยวข้อง (พิมพ์เอง)</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 outline-none text-black"
                    placeholder="เช่น Portfolio ไม่เกิน 10 หน้า, สำเนาบัตรปชช."
                    value={form.related_documents}
                    onChange={(e) => setForm({ ...form, related_documents: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-black">ลิงก์รายละเอียด (URL) <span className="text-red-500">*</span></label>
                <input
                  type="url"
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-orange-200 outline-none text-black"
                  placeholder="https://www.example.com/details..."
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  required
                />
              </div>

              <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                <label className="block text-sm font-bold text-black mb-3">🕒 กำหนดการรับสมัคร</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-black">วันเปิดรับสมัคร (Start Date)</label>
                    <input
                      type="datetime-local"
                      className="w-full border rounded px-3 py-2 outline-none text-black"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-black">วันปิดรับสมัคร (End Date)</label>
                    <input
                      type="datetime-local"
                      className="w-full border rounded px-3 py-2 outline-none text-black"
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-black">จำนวนรับ (คน)</label>
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2 outline-none text-black"
                    value={form.quota}
                    onChange={(e) => setForm({ ...form, quota: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-black">สถานะ</label>
                  <select
                    className={`w-full border rounded px-3 py-2 outline-none font-semibold ${
                      form.status === 'open' ? 'text-green-600 bg-green-50' :
                      form.status === 'opening' ? 'text-orange-600 bg-orange-50' :
                      form.status === 'closed' ? 'text-red-600 bg-red-50' : 'text-black'
                    }`}
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="" className="text-black">⚪ ไม่มีสถานะ</option>
                    <option value="open" className="text-green-600">🟢 เปิดอยู่</option>
                    <option value="opening" className="text-orange-600">🟠 กำลังเปิด</option>
                    <option value="closed" className="text-red-600">🔴 ปิดแล้ว</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded border px-4 py-2 hover:bg-gray-100 text-black"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-orange-500 px-6 py-2 text-white font-bold hover:bg-orange-600 disabled:opacity-50"
                >
                  {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}