"use client";

export default function StudentPage() {
  return (
    <div className="mt-4">
      <div className="rounded-2xl border border-[#d5e1f5] bg-white shadow-sm">
        <div className="min-h-[70vh] rounded-2xl border border-[#d5e1f5] bg-[#f8fbff] p-12 flex items-center justify-center text-center">
          <div className="text-gray-500 space-y-1 leading-relaxed">
            <p>ยินดีต้อนรับ: เข้ามาหน้านี้ด้วยสิทธิ์ "นักเรียน" (Student)</p>
            <p>เนื้อหาสำหรับนักเรียนเท่านั้น...</p>
            <p>ลองหาแสดงดู</p>
          </div>
        </div>
      </div>
    </div>
  );
}
