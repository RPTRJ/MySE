"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginService } from "@/services/auth";

export default function LoginPage() {
  const router = useRouter();
  
  // State สำหรับเก็บค่าจากฟอร์ม
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // ป้องกันหน้าเว็บ Refresh
    setError("");

    try {
      // 1. เรียก API Login
      const res = await loginService(email, password);
      const user = res.user;

      console.log("User Role ID:", user.type_id); // ดูค่าใน Console ว่าได้เลขอะไร

      // 2. เก็บ Token (ตัวอย่างเก็บใน LocalStorage)
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(user));

      // 3. Logic แยกหน้าตาม Role (สมมติเลข ID ตาม Database)
      // ** หมายเหตุ: ต้องเช็คใน DB ว่า account_types ของคุณ ID ไหนคืออะไร **
      switch (user.type_id) {
        case 1: // สมมติ 1 = นักเรียน
          router.push("/student");
          break;
        case 2: // สมมติ 2 = อาจารย์
          router.push("/teacher");
          break;
        case 3: // สมมติ 3 = แอดมิน
          router.push("/admin");
          break;
        default:
          setError("ไม่พบสิทธิ์การใช้งาน (Unknown Role)");
      }

    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '300px' }}>
        <h2>เข้าสู่ระบบ (Login)</h2>
        
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
            placeholder="user@example.com"
          />
        </div>

        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
            placeholder="******"
          />
        </div>

        <button type="submit" style={{ padding: '10px', cursor: 'pointer', backgroundColor: '#0070f3', color: 'white', border: 'none' }}>
          Login
        </button>
      </form>
    </div>
  );
}