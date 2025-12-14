"use client";

import Link from "next/link";
import { UserRoundPen, ArrowRight, GraduationCap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="pt-10 px-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-orange-100 text-orange-600">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">ยินดีต้อนรับสู่แดชบอร์ดนักเรียน</h1>
          <p className="text-gray-600 mt-1">เข้าถึงทุกเครื่องมือได้หลังจากเข้าสู่ระบบแล้ว</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-orange-50 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white shadow-inner text-orange-600">
              <UserRoundPen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">ข้อมูลส่วนตัว</p>
              <h2 className="text-lg font-semibold text-gray-900">แก้ไขโปรไฟล์นักเรียน</h2>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            ปรับปรุงข้อมูลผู้ใช้ ประวัติการศึกษา คะแนน GED/Academic ภาษา และ BT-D ได้จากหน้านี้หลังเข้าสู่ระบบสำเร็จ
          </p>
          <Link
            href="/student/profile"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-orange-700 hover:text-orange-800"
          >
            ไปยังหน้าจัดการโปรไฟล์
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
