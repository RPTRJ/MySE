// src/components/layout/menu.tsx (หรือ .ts)

import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  FileText, 
  ShieldAlert,
  Calendar,
  Search,
  GraduationCap,
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
    name: "หน้าหลัก ",
    href: "/teacher", // ชี้ไปที่ app/teacher/page.tsx
    icon: LayoutDashboard,
    roles: ["teacher"],
  },
  {
    name: "ข้อมูลนักเรียน",
    href: "/teacher/students",
    icon: Users,
    roles: ["teacher"],
  },
  {
    name: "หน้าหลัก (Admin)",
    href: "/admin", // ชี้ไปที่ app/admin/page.tsx
    icon: LayoutDashboard,
    roles: ["admin"],
  },
  {
    name: "โปรไฟล์ผู้ใช้",
    href: "/admin/users",
    icon: Users,
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
  {
    name: "ข้อมูลการศึกษา",
    href: "/admin/education",
    icon: GraduationCap,
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
    href: "/student/portfolio",
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
    href: "/student/announcements", // ถ้าประกาศเป็น Public Route
    icon: ShieldAlert,
    roles: ["student"],
  },
  {
    name: "ประชาสัมพันธ์ข่าวสาร",
    href: "/admin/announcements",
    icon: ShieldAlert,
    roles: ["admin"],
  },
  {
    name: "ประชาสัมพันธ์ข่าวสาร",
    href: "/teacher/announcements",
    icon: ShieldAlert,
    roles: ["teacher"],
  },
  //-------------------------ปฏิทิน-------------------------
  {
    name: "ปฏิทิน",
    href: "/student/calendar", // ถ้าประกาศเป็น Public Route
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
