"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/src/components/layout/sidebar";
import { fetchCurriculumSummary, type CurriculumSummaryDTO } from "@/services/curriculum";

export default function CurriculumReportPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [data, setData] = useState<CurriculumSummaryDTO | null>(null);
  const [loading, setLoading] = useState(false);

  // auth check
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
        router.push("/login");
        return;
      }
      setIsAuthorized(true);
    } catch {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthorized) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetchCurriculumSummary();
        setData(res);
      } catch (err) {
        console.error(err);
        alert("โหลดข้อมูลสรุปไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthorized]);

  if (!isAuthorized) return null;

  const total = data?.total_curricula ?? 0;
  const open = data?.open_curricula ?? 0;
  const students = data?.total_students ?? 0;
  const openPercent = total > 0 ? (open / total) * 100 : 0;

  const maxStudents =
    data?.by_program && data.by_program.length > 0
      ? Math.max(...data.by_program.map((p) => p.student_count))
      : 0;

  return (
    <>
      <Sidebar userRole="admin" />
      <div className="ml-64 mt-16 p-8 bg-[#f5f5f5] min-h-screen">
        <header className="bg-orange-500 text-white px-6 py-4 rounded-t-lg shadow max-w-5xl">
          <h1 className="text-xl font-bold">รายงานหลักสูตรทั้งหมด</h1>
        </header>

        <section className="bg-white border border-orange-200 border-t-0 rounded-b-lg p-6 max-w-5xl space-y-6">
          {loading && <p className="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>}

          {/* ค่า summary เหนือกราฟ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="rounded bg-blue-50 border border-blue-200 p-4">
              <p className="font-semibold">📚 จำนวนหลักสูตรทั้งหมด</p>
              <p className="mt-2 text-2xl font-bold">{total}</p>
            </div>
            <div className="rounded bg-green-50 border border-green-200 p-4">
              <p className="font-semibold">🎓 หลักสูตรที่เปิดรับสมัครอยู่</p>
              <p className="mt-2 text-2xl font-bold">{open}</p>
            </div>
            <div className="rounded bg-purple-50 border border-purple-200 p-4">
              <p className="font-semibold">👨‍🎓 จำนวนนักศึกษาทั้งหมด</p>
              <p className="mt-2 text-2xl font-bold">{students}</p>
            </div>
          </div>

          {/* กราฟ 2 ช่องเหมือนรูป */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Bar chart – แสดงจำนวนนักศึกษาในแต่ละสาขา */}
            <div className="bg-[#f9fafb] rounded border p-4">
              <p className="font-semibold mb-3 text-sm">
                กราฟแสดงการรับนักศึกษาในแต่ละสาขา
              </p>
              <div className="h-56 flex items-end gap-3 border-t border-x pt-4 px-3">
                {data?.by_program && data.by_program.length > 0 ? (
                  data.by_program.map((p) => {
                    const h =
                      maxStudents > 0
                        ? Math.max((p.student_count / maxStudents) * 100, 10)
                        : 0;
                    return (
                      <div
                        key={p.program_name}
                        className="flex flex-col items-center justify-end flex-1"
                      >
                        <div
                          className="w-8 rounded-t bg-blue-500"
                          style={{ height: `${h}%` }}
                          title={`${p.program_name}: ${p.student_count} คน`}
                        />
                        <span className="mt-2 text-[10px] text-center">
                          {p.program_name}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-500">ไม่มีข้อมูล</p>
                )}
              </div>
            </div>

            {/* Pie / Donut chart – ใช้ conic-gradient แทน */}
            <div className="bg-[#f9fafb] rounded border p-4 flex flex-col items-center justify-center">
              <p className="font-semibold mb-3 text-sm">
                กราฟแสดงจำนวนหลักสูตรที่เปิดแล้ว
              </p>
              <div className="relative h-40 w-40 rounded-full flex items-center justify-center"
                   style={{
                     backgroundImage: `conic-gradient(#6366f1 0 ${openPercent}%, #f97373 ${openPercent}% 100%)`,
                   }}>
                <div className="absolute h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-inner">
                  <span className="text-xl font-bold">{open}</span>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-700 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-[#6366f1]" />
                  <span>จำนวนหลักสูตรที่เปิดแล้ว</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-[#f97373]" />
                  <span>จำนวนหลักสูตรทั้งหมด</span>
                </div>
              </div>
            </div>
          </div>

          {/* ปุ่ม Export เหมือนรูป */}
          <div className="mt-4 flex gap-3 text-xs">
            <button className="rounded border border-gray-400 px-3 py-1 hover:bg-gray-100 flex items-center gap-1">
              📄 Export CSV
            </button>
            <button className="rounded border border-gray-400 px-3 py-1 hover:bg-gray-100 flex items-center gap-1">
              📄 Export PDF
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
