"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TeacherPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(userStr);

    // เช็คว่าเป็น ID 2 (Teacher) หรือไม่?
    if (user.type_id !== 2) {
      alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (สำหรับอาจารย์เท่านั้น)");
      router.push("/login");
      return;
    }

    setIsAuthorized(true);
  }, [router]);

  if (!isAuthorized) {
    return null;
  }

  return (
    <div style={{ padding: '50px' }}>
      <h1>ยินดีต้อนรับ: เข้ามาหน้านี้ด้วยสิทธิ์ "อาจารย์" (Teacher)</h1>
      <p>เนื้อหาสำหรับอาจารย์เท่านั้น...</p>
    </div>
  );
}