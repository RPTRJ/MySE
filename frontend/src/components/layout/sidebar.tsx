// components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut ,Menu} from "lucide-react"; // import แค่อันที่ใช้ใน UI
import { menuItems, type UserRole } from "./menu"; // Import ข้อมูลเข้ามา
import { menu } from "framer-motion/client";
import { useState } from "react";

interface SidebarProps {
  userRole: string;
}

export default function Sidebar({ userRole }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const currentRole = userRole as UserRole;

  return (
    <aside 
    // className="flex h-screen w-64 flex-col  bg-white text-gray-900 shadow-md rounded-r-3xl"
    className={`flex h-screen flex-col bg-white text-gray-900 shadow-md  transition-all duration-200 ${
      isOpen ? "w-64" : "w-16"
    }  rounded-r-3xl`}
    >

    {/* Header */}
      <div className="flex h-16 items-center justify-startx px-5 border-gray-200 border-b">
        {isOpen && <h1 className="text-xl font-bold text-orange-500 ">MyPortfolio</h1>}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="ml-auto rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-white-500"
        >
          <Menu className="h-6 w-6 text-gray-400" />
        </button>
      </div>

      {/* Navigation Links */}
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
              {isOpen && <span className="ml-3">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}