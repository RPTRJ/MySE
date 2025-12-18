"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, User } from "lucide-react";

interface TopbarProps {
  userRole: string; // รับ Role มาโชว์
  userName: string; // รับชื่อมาโชว์
}

export default function Topbar({ userRole, userName }: TopbarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isStudent = userRole === "student";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current || menuRef.current.contains(event.target as Node)) {
        return;
      }
      setMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <header className="flex h-20 items-center justify-between bg-gray-50 px-4">
      <div className="flex h-16 w-full items-center justify-between bg-white px-6 shadow-md rounded-3xl mt-2">
        {/* ฝั่งซ้าย (ว่างไว้หรือใส่ Title หน้า) */}
        <div className="text-lg font-semibold text-gray-700">Application</div>

        {/* ฝั่งขวา (User Profile) */}
        <div className="relative flex items-center gap-2" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200">
              <User className="h-5 w-5 text-gray-600" />
            </span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-12 w-56 rounded-xl border border-gray-100 bg-white p-3 shadow-lg"
              role="menu"
            >
              <div className="mb-2 border-b border-gray-100 pb-2">
                <div className="text-sm font-semibold text-gray-900">{userName}</div>
                <div className="text-xs text-gray-500 uppercase">{userRole}</div>
              </div>
              {isStudent && (
                <Link
                  href="/student/profile"
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  <User className="h-4 w-4 text-gray-500" />
                  ข้อมูลส่วนตัว
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-red-600 hover:bg-red-50"
                role="menuitem"
              >
                <LogOut className="h-4 w-4" />
                ออกจากระบบ
              </button>
            </div>
          )}
        </div>
      </div>
      
    </header>
  );
}
