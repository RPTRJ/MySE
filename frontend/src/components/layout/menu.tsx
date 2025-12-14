// src/components/layout/menu.tsx (หรือ .ts)

import { 
  LayoutDashboard, 
  Users, 
  UserCircle,
  Settings, 
  FileText, 
  ShieldAlert,
  Calendar,
  Search,
  // ไม่ต้องใช้ LogOut ที่นี่ เพราะ LogOut มักจะเป็นปุ่มแยกต่างหาก
} from "lucide-react";
import React from 'react';

//Type ของ Role
export type UserRole = "admin" | "teacher" | "student";

//Interface สำหรับเมนู
export interface MenuItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[]; // ระบุว่า Role ไหนเข้าถึงได้บ้าง
}

export const menuItems: MenuItem[] = [
  // ------------------------- หน้าหลัก (Dashboard) -------------------------
  {
    name: "หน้าหลัก",
    href: "/student/home", // ชี้ไปที่ app/student/page.tsx
    icon: LayoutDashboard,
    roles: ["student"],
  },
  {
    name: "ข้อมูลส่วนตัว",
    href: "/student/profile",
    icon: UserCircle,
    roles: ["student"],
  },
  {
    name: "หน้าหลัก ",
    href: "/teacher", // ชี้ไปที่ app/teacher/page.tsx
    icon: LayoutDashboard,
    roles: ["teacher"],
  },
  {
    name: "หน้าหลัก (Admin)",
    href: "/admin", // ชี้ไปที่ app/admin/page.tsx
    icon: LayoutDashboard,
    roles: ["admin"],
  },
  // ⭐⭐ เมนูค้นหาหลักสูตรสำหรับ Student ⭐⭐
  {
    name: "ค้นหาหลักสูตร",
    href: "/student/curricula",   // หน้า Search หลักสูตร
    icon: Search,
    roles: ["student"],
  },
  {
    name: "จัดการหลักสูตร",
    href: "/admin/curricula",   // CRUD: list/create/edit/delete
    icon: Search,
    roles: ["admin"],
  },
  // ------------------------- คลังผลงาน (Activitys) -------------------------
  {
    name: "คลังผลงาน",
    href: "/student/working", 
    icon: Users,
    roles: ["student"], // เฉพาะนักเรียน
  },
  {
    name: "คลังกิจกรรม",
    href: "/student/activity",
    icon: Users,
    roles: ["student"],
  },

  // ------------------------- แฟ้มสะสมผลงาน (Portfolios) -------------------------
  {
    name: "แฟ้มสะสมผลงาน",
    href: "/student/portfolios",
    icon: FileText,
    roles: ["student"], 
  },
  {
    name: "ตรวจสอบ Portfolios",
    href: "/teacher/checkportfolio",
    icon: FileText,
    roles: ["teacher"], 
  },
  
  // ------------------------- Template -------------------------
  {
    name: "Template",
    href: "/admin/template",
    icon: Users,
    roles: ["admin"],
  },

  // ------------------------- ข่าวสาร และประกาศ -------------------------
  {
    name: "ประกาศ/ข่าวสาร",
    href: "/announcements", // ถ้าประกาศเป็น Public Route
    icon: ShieldAlert,
    roles: ["admin", "student", "teacher"], // ทุกคนเห็น
  },
  //-------------------------ปฏิทิน-------------------------
  {
    name: "ปฏิทิน",
    href: "/calendar", // ถ้าประกาศเป็น Public Route
    icon: Calendar,
    roles: ["student"],
  },

  // ------------------------- Settings -------------------------
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["admin", "teacher", "student"],
  },
];
