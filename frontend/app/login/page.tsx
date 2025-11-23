"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginService, registerService } from "@/services/auth";
import { Lock, Mail, ArrowRight, Loader2, Phone, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; // Import Framer Motion

export default function AuthPage() {
  const router = useRouter();
  
  // State
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --- Login State ---
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // --- Register State ---
  const [regData, setRegData] = useState({
    email: "",
    phone: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");

  // Toggle Mode
  const toggleMode = (mode: boolean) => {
    setError("");
    setSuccess("");
    setIsLoginMode(mode);
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await loginService(loginEmail, loginPassword);
      const user = res.user;
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.type_id === 1) router.push("/student");
      else if (user.type_id === 2) router.push("/teacher");
      else if (user.type_id === 3) router.push("/admin");
      else setError("ไม่พบสิทธิ์การใช้งาน");

    } catch (err: any) {
      setError(err.message || "เข้าสู่ระบบไม่สำเร็จ");
      setIsLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (regData.password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        email: regData.email,
        password: regData.password,
        phone: regData.phone,
        first_name_th: "สมาชิก",
        last_name_th: "ใหม่",
        first_name_en: "New",
        last_name_en: "Member",
        birthday: "2000-01-01",
        type_id: 1,
        id_type: 1,
        pdpa_consent: true
      };

      await registerService(payload);
      
      setIsLoading(false);
      setSuccess("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
      setIsLoginMode(true); 
      
      setRegData({ email: "", phone: "", password: "" });
      setConfirmPassword("");

    } catch (err: any) {
      setError(err.message || "สมัครสมาชิกไม่สำเร็จ");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-neutral-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
      
      {/* Card Container with Framer Motion Layout */}
      <motion.div 
        layout // *** กุญแจสำคัญ: ทำให้กล่องยืดหดตามเนื้อหาแบบ Smooth ***
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-black/50 p-8 shadow-2xl backdrop-blur-md sm:p-10 overflow-hidden"
      >
        
        {/* AnimatePresence: จัดการ Animation ตอนสลับ Component */}
        <AnimatePresence mode="wait" initial={false}>
          {isLoginMode ? (
            // --- LOGIN MODE ---
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-white">
                  ยินดีต้อนรับกลับมา
                </h2>
                <p className="mt-2 text-sm text-neutral-400">
                  กรุณาเข้าสู่ระบบเพื่อใช้งาน MySE Platform
                </p>
              </div>

              {/* Messages */}
              {success && (
                <div className="mb-6 rounded-md bg-green-500/10 p-3 text-sm text-green-400 border border-green-500/20 text-center">
                  {success}
                </div>
              )}
              {error && (
                <div className="mb-6 rounded-md bg-red-900/30 p-3 text-sm text-red-400 border border-red-900/50 text-center">
                  {error}
                </div>
              )}

              <form className="space-y-6" onSubmit={handleLogin}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300">อีเมล</label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-neutral-500" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="block w-full rounded-lg border border-neutral-800 bg-neutral-900/50 py-3 pl-10 pr-4 text-neutral-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all"
                        placeholder="student@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300">รหัสผ่าน</label>
                    <div className="relative mt-2">
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-neutral-500" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="block w-full rounded-lg border border-neutral-800 bg-neutral-900/50 py-3 pl-10 pr-4 text-neutral-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex w-full justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-70 transition-all"
                >
                  {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                  {!isLoading && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />}
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-neutral-500">
                ยังไม่มีบัญชีผู้ใช้?{" "}
                <button 
                  onClick={() => toggleMode(false)} 
                  className="font-semibold text-blue-500 hover:text-blue-400 hover:underline focus:outline-none"
                >
                  สมัครสมาชิกที่นี่
                </button>
              </div>
            </motion.div>
          ) : (
            // --- REGISTER MODE ---
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-white">
                  สร้างบัญชีใหม่
                </h2>
                <p className="mt-2 text-sm text-neutral-400">
                  กรอกข้อมูลเพื่อเริ่มต้นใช้งาน
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-md bg-red-900/30 p-3 text-sm text-red-400 border border-red-900/50 text-center">
                  {error}
                </div>
              )}

              <form className="space-y-6" onSubmit={handleRegister}>
                <div className="space-y-4">
                  
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300">อีเมล</label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-neutral-500" />
                      <input
                        type="email"
                        required
                        value={regData.email}
                        onChange={(e) => setRegData({...regData, email: e.target.value})}
                        className="block w-full rounded-lg border border-neutral-800 bg-neutral-900/50 py-3 pl-10 pr-4 text-neutral-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all"
                        placeholder="student@example.com"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300">เบอร์โทรศัพท์</label>
                    <div className="relative mt-2">
                      <Phone className="absolute left-3 top-2.5 h-5 w-5 text-neutral-500" />
                      <input
                        type="tel"
                        required
                        value={regData.phone}
                        onChange={(e) => setRegData({...regData, phone: e.target.value})}
                        className="block w-full rounded-lg border border-neutral-800 bg-neutral-900/50 py-3 pl-10 pr-4 text-neutral-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all"
                        placeholder="0812345678"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300">รหัสผ่าน</label>
                    <div className="relative mt-2">
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-neutral-500" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={regData.password}
                        onChange={(e) => setRegData({...regData, password: e.target.value})}
                        className="block w-full rounded-lg border border-neutral-800 bg-neutral-900/50 py-3 pl-10 pr-4 text-neutral-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all"
                        placeholder="•••••••• (ขั้นต่ำ 6 ตัวอักษร)"
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300">ยืนยันรหัสผ่าน</label>
                    <div className="relative mt-2">
                      <Check className="absolute left-3 top-2.5 h-5 w-5 text-neutral-500" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`block w-full rounded-lg border ${
                          confirmPassword && regData.password !== confirmPassword 
                          ? "border-red-500 focus:ring-red-500" 
                          : "border-neutral-800 focus:ring-blue-500"
                        } bg-neutral-900/50 py-3 pl-10 pr-4 text-neutral-200 focus:border-blue-500 focus:outline-none focus:ring-1 sm:text-sm transition-all`}
                        placeholder="กรอกรหัสผ่านอีกครั้ง"
                      />
                    </div>
                    {confirmPassword && regData.password !== confirmPassword && (
                      <p className="mt-1 text-xs text-red-400">รหัสผ่านไม่ตรงกัน</p>
                    )}
                  </div>

                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex w-full justify-center rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-70 transition-all"
                >
                  {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {isLoading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-neutral-500">
                มีบัญชีอยู่แล้ว?{" "}
                <button 
                  onClick={() => toggleMode(true)} 
                  className="font-semibold text-blue-500 hover:text-blue-400 hover:underline focus:outline-none"
                >
                  กลับไปเข้าสู่ระบบ
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}