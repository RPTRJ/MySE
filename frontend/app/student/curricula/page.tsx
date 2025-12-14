"use client";

import { useEffect, useState } from "react";
import { fetchPublicCurricula, type CurriculumDTO } from "@/services/curriculum";

export default function StudentCurriculaSearchPage() {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<CurriculumDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadCurricula() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPublicCurricula(search);
      setItems(data);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Real-time Search Effect
  useEffect(() => {
    // หน่วงเวลา 500ms
    const delayDebounceFn = setTimeout(() => {
      loadCurricula();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]); // ทำงานเมื่อ search เปลี่ยน

  function formatPeriodDisplay(period?: string) {
    if (!period) return "-";
    if (period.includes("|")) {
      const [start, end] = period.split("|");
      const fmt = (d: string) => d ? new Date(d).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '?';
      return `${fmt(start)} - ${fmt(end)}`;
    }
    return period;
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "open":
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800 border border-green-200">
            🟢 เปิดรับสมัคร
          </span>
        );
      case "opening":
        return (
          <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800 border border-orange-200">
            🟠 กำลังเปิด
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800 border border-red-200">
            🔴 ปิดรับสมัคร
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-black border border-gray-200">
            ⚪ ไม่ระบุ
          </span>
        );
    }
  }

  return (
    <div className="mt-16 px-4 md:px-8 pb-10">
      <header className="bg-orange-500 text-white px-6 py-4 rounded-t-lg shadow mb-0">
        <div className="flex items-center gap-3">
          <h2 className="text-white font-bold text-xl">
            ระบบรับสมัครนักศึกษา (ค้นหาหลักสูตร)
          </h2>
        </div>
      </header>

      <section className="bg-[#fff7f0] border border-orange-200 border-t-0 rounded-b-lg p-6 min-h-[500px]">
        
        {/* Search Bar */}
        <div className="mb-6">
          <label className="font-bold text-black text-lg mb-2 block">🔍 ค้นหาหลักสูตร:</label>
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <input
              type="text"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm"
              placeholder="พิมพ์รหัส / ชื่อหลักสูตร / สาขาวิชา..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              onClick={loadCurricula}
              className="rounded-lg bg-orange-500 px-6 py-2 font-bold text-white hover:bg-orange-600 shadow-sm transition-colors"
            >
              ค้นหา
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-black font-bold text-xl border-l-4 border-orange-500 pl-3">
            รายชื่อหลักสูตรที่เปิดรับสมัคร
          </h2>
          <span className="text-sm text-gray-600 font-medium">
            ทั้งหมด {items.length} รายการ
          </span>
        </div>

        {/* Loading / Error States */}
        {loading && <p className="text-gray-600 text-center py-10">กำลังโหลดข้อมูล...</p>}
        {error && <p className="text-red-600 text-center py-10">{error}</p>}
        {!loading && !error && items.length === 0 && (
          <div className="text-center py-16 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
            <p className="text-lg">ไม่พบหลักสูตรที่ตรงกับคำค้นหา</p>
            <p className="text-sm">ลองค้นหาด้วยคำสำคัญอื่น</p>
          </div>
        )}

        {/* Grid Layout (Card View) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((cur) => (
            <div
              key={cur.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-gray-200 flex flex-col"
            >
              <div className="bg-orange-50 px-5 py-3 border-b border-orange-100 flex justify-between items-start">
                <div>
                  <div className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-1">
                    {cur.faculty?.name || "ไม่ระบุสำนักวิชา"}
                  </div>
                  <div className="text-sm font-semibold text-gray-700">
                    {cur.program?.name || "ไม่ระบุสาขา"}
                  </div>
                </div>
                <div className="bg-white text-orange-600 text-xs font-bold px-2 py-1 rounded border border-orange-200 shadow-sm">
                  {cur.code}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col gap-3 text-black">
                <h3 className="font-bold text-lg text-black leading-tight min-h-[3rem]">
                  {cur.name}
                </h3>

                <div className="text-sm space-y-2 mt-2">
                  <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span className="text-gray-600">GPAX ขั้นต่ำ:</span>
                    <span className="font-bold text-black">{cur.gpax_min?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span className="text-gray-600">จำนวนรับ:</span>
                    <span className="font-bold text-black">{cur.quota ? `${cur.quota} คน` : "-"}</span>
                  </div>
                  <div className="flex flex-col border-b border-gray-100 pb-1">
                    <span className="text-gray-600 mb-1">ช่วงรับสมัคร:</span>
                    <span className="font-medium text-black ml-2">📅 {formatPeriodDisplay(cur.application_period)}</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-gray-600 mb-1">เอกสาร/เงื่อนไข:</span>
                     <span className="font-medium text-black text-xs bg-gray-50 p-2 rounded border border-gray-100">
                        {cur.description || "-"}
                     </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-5 py-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                    {getStatusBadge(cur.status)}
                </div>

                {cur.link ? (
                  <a
                    href={cur.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    👁 ดูรายละเอียด
                  </a>
                ) : (
                  <button disabled className="bg-gray-300 text-gray-500 text-sm font-bold px-4 py-2 rounded-lg cursor-not-allowed">
                    👁 ดูรายละเอียด
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}