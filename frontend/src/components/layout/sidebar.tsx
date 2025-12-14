// components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react"; // import แค่อันที่ใช้ใน UI
import { menuItems, type UserRole } from "./menu"; // Import ข้อมูลเข้ามา
import { menu } from "framer-motion/client";

interface SidebarProps {
  userRole: string;
}

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const currentRole = userRole as UserRole;

  return (
    <aside className="flex h-screen w-64 flex-col  bg-white text-gray-900 shadow-md rounded-r-3xl">
      <div className="flex h-16 items-center justify-startx px-6 border-gray-200 border-b">
        <h1 className="text-xl font-bold text-orange-500 ">MyPortfolio</h1>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-4">
        {/* วนลูปจากตัวแปรที่ Import เข้ามาแทน */}
        {menuItems.map((item) => {
          // Logic ตรวจสอบสิทธิ์ยังคงอยู่ที่นี่ (หรือย้ายไปเป็น Utility function ก็ได้)
          if (!item.roles.includes(currentRole)) return null;

          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center rounded-md px-3 py-3 text-lg font-medium transition-colors ${
                isActive
                  ? "bg-orange-500 text-white"
                  : "text-gray-400 hover:bg-orange-100 hover:text-orange-500"
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  isActive ? "text-white" : "text-gray-400 group-hover:text-orange-500"
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4 border-gray-200">
        <button className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
          <LogOut className="mr-3 h-5 w-5 text-red-500 group-hover:text-red-600" />
          Logout
        </button>
      </div>
    </aside>
  );
}