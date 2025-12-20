"use client";

import { User } from "lucide-react";

interface TopbarProps {
  userRole: string; // รับ Role มาโชว์
  userName: string; // รับชื่อมาโชว์
}

export default function Topbar({ userRole, userName }: TopbarProps) {
  return (
    <header className="flex h-20 items-center justify-between bg-gray-50 px-4">
      <div className="flex h-16 w-full items-center justify-between bg-white px-6 shadow-md rounded-3xl mt-2">
        {/* ฝั่งซ้าย (ว่างไว้หรือใส่ Title หน้า) */}
        <div className="text-lg font-semibold text-gray-700">Application</div>

        {/* ฝั่งขวา (User Profile) */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">{userName}</div>
            <div className="text-xs font-light text-gray-500 uppercase">{userRole}</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
            <User className="h-6 w-6 text-gray-600" />
          </div>
        </div>
      </div>
      
    </header>
  );
}