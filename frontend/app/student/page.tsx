"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      router.push("/login"); // ถ้าไม่มีของ ให้ไปหน้า Login
      return;
    }

    const user = JSON.parse(userStr);

    // เช็คว่าเป็น ID 1 (Student) หรือไม่?
    if (user.type_id !== 1) {
      alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (สำหรับนักเรียนเท่านั้น)");
      router.push("/login"); // ดีดกลับไปหน้า Login หรือหน้าหลักของเขา
      return;
    }

    // ถ้าผ่านหมด ให้แสดงผลได้
    setIsAuthorized(true);
  }, [router]);

  if (!isAuthorized) {
    return null; // หรือใส่ Loading... ระหว่างรอเช็ค
  }

  return (
    <div style={{ padding: '50px' }}>
      <h1>ยินดีต้อนรับ: เข้ามาหน้านี้ด้วยสิทธิ์ "นักเรียน" (Student)</h1>
      <p>เนื้อหาสำหรับนักเรียนเท่านั้น...</p>
    </div>
  );
}