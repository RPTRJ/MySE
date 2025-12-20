"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface OnboardingForm {
  idType: "citizen_id" | "passport" | "g_code";
  idNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  birthday: string;
  pdpa: boolean;
  educationLevelId: string;
  curriculumTypeId: string;
  isProjectBased: boolean;
  curriculumId: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const steps = ["ข้อมูลส่วนตัว", "ประวัติการศึกษา"];
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<OnboardingForm>({
    idType: "citizen_id",
    idNumber: "",
    firstName: "",
    lastName: "",
    phone: "",
    birthday: "",
    pdpa: false,
    educationLevelId: "",
    curriculumTypeId: "",
    isProjectBased: false,
    curriculumId: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPdpaModal, setShowPdpaModal] = useState(true);

  const clearFieldError = (key: keyof OnboardingForm) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setError("");
  };

  const onChange = (key: keyof OnboardingForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    clearFieldError(key);
  };

  const detectLanguage = () => {
    const raw = `${form.firstName}${form.lastName}`;
    const hasThai = /[ก-๙]/.test(raw);
    const hasEng = /[A-Za-z]/.test(raw);
    return {
      isThai: hasThai && !hasEng,
      isEng: hasEng && !hasThai,
      mixed: hasThai && hasEng,
    };
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!form.idNumber) errs.idNumber = "กรุณากรอกหมายเลขเอกสาร (เช่น 1100xxxxxxxxx)";
    if (!form.firstName) errs.firstName = "กรุณากรอกชื่อของท่าน / Enter your name";
    if (!form.lastName) errs.lastName = "กรุณากรอกนามสกุลของท่าน / Enter your surname";
    if (!form.phone) errs.phone = "กรุณากรอกเบอร์โทรศัพท์";
    if (!form.birthday) errs.birthday = "กรุณาเลือกวันเกิด (รูปแบบ YYYY-MM-DD)";
    if (!form.pdpa) errs.pdpa = "กรุณายืนยันการยินยอม PDPA";

    if (form.idType === "citizen_id") {
      const digits = form.idNumber.replace(/\D/g, "");
      if (digits.length !== 13) {
        errs.idNumber = "เลขบัตรประชาชนต้องมี 13 หลัก";
      }
    }

    const thaiPattern = /^[\u0E00-\u0E7F\s'-]+$/;
    const engPattern = /^[A-Za-z\s'-]+$/;

    const lang = detectLanguage();
    const hasBothNames = form.firstName.trim() !== "" && form.lastName.trim() !== "";

    if (hasBothNames) {
      if (lang.mixed) {
        errs.firstName = "ต้องใช้ภาษาเดียวกัน (ไทยล้วนหรืออังกฤษล้วน)";
        errs.lastName = "ต้องใช้ภาษาเดียวกัน (ไทยล้วนหรืออังกฤษล้วน)";
      } else if (lang.isThai) {
        if (!thaiPattern.test(form.firstName) || !thaiPattern.test(form.lastName)) {
          errs.firstName = "ต้องเป็นภาษาไทยทั้งหมด";
          errs.lastName = "ต้องเป็นภาษาไทยทั้งหมด";
        }
      } else if (lang.isEng) {
        if (!engPattern.test(form.firstName) || !engPattern.test(form.lastName)) {
          errs.firstName = "ต้องเป็นภาษาอังกฤษทั้งหมด";
          errs.lastName = "ต้องเป็นภาษาอังกฤษทั้งหมด";
        }
      } else {
        errs.firstName = "ต้องเป็นภาษาไทยหรืออังกฤษเท่านั้น";
        errs.lastName = "ต้องเป็นภาษาไทยหรืออังกฤษเท่านั้น";
      }
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError("กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง");
      return false;
    }
    setFieldErrors({});
    setError("");
    return true;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!form.educationLevelId) errs.educationLevelId = "กรุณาเลือกระดับการศึกษา";
    if (!form.curriculumTypeId) errs.curriculumTypeId = "กรุณาเลือกประเภทหลักสูตร";
    if (!form.curriculumId) errs.curriculumId = "กรุณากรอก/เลือกหลักสูตร";

    if (Object.keys(errs).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...errs }));
      setError("กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง");
      return false;
    }
    return true;
  };

  const handleNext = async (e: FormEvent) => {
    e.preventDefault();

    if (currentStep === 0) {
      if (!validateStep1()) return;

      // Check duplicate id before moving on
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/users/me/check-id?id_number=${encodeURIComponent(form.idNumber)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 409) {
          setFieldErrors((prev) => ({ ...prev, idNumber: "เลขนี้ถูกลงทะเบียนไปแล้ว" }));
          setError("");
          return;
        }
        // ถ้าไม่ใช่ 409 แม้สถานะอื่นให้เดินหน้าต่อ (ไม่บล็อก), แต่เคลียร์ข้อความเดิมออก
        clearFieldError("idNumber");
      } catch {
        // ถ้าเช็กไม่สำเร็จ ให้เดินหน้าต่อ แต่ไม่ตั้ง error บล็อก
        clearFieldError("idNumber");
      }
    }

    // Not final step: move forward
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
      return;
    }

    // Validate step 2 before submit
    if (!validateStep2()) return;

    // Final step: submit to API
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/login");
      return;
    }

    setSubmitting(true);
    const lang = detectLanguage();

    try {
      const res = await fetch(`${API_URL}/users/me/onboarding`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_type_name: form.idType,
          id_number: form.idNumber,
          first_name_th: lang.isThai ? form.firstName : "",
          last_name_th: lang.isThai ? form.lastName : "",
          first_name_en: lang.isThai ? "" : form.firstName,
          last_name_en: lang.isThai ? "" : form.lastName,
          phone: form.phone,
          birthday: form.birthday,
          pdpa_consent: form.pdpa,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
        return;
      }

      if (res.status === 409) {
        setFieldErrors((prev) => ({ ...prev, idNumber: "เลขนี้ถูกลงทะเบียนไปแล้ว" }));
        setError("");
        return;
      }

      if (!res.ok) {
        setError(data?.error || "บันทึกข้อมูลไม่สำเร็จ ลองอีกครั้ง");
        return;
      }

      const user = data?.data;
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }
      router.push("/student");
    } catch {
      setError("บันทึกข้อมูลไม่สำเร็จ ลองอีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 0) {
      router.push("/login");
      return;
    }
    setCurrentStep((s) => Math.max(0, s - 1));
  };

  const handlePdpaAccept = () => {
    setForm((prev) => ({ ...prev, pdpa: true }));
    setShowPdpaModal(false);
    setError("");
    setFieldErrors((prev) => {
      const { pdpa, ...rest } = prev;
      return rest;
    });
  };

  const handlePdpaReject = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  useEffect(() => {
    setShowPdpaModal(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f7fb] py-6">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-4 flex items-center gap-2 text-gray-700">
          <button onClick={handleBack} className="p-2 rounded-full hover:bg-gray-200" aria-label="ย้อนกลับ">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold">สร้างโปรไฟล์</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
          <form className="space-y-6" onSubmit={handleNext}>
            {/* Stepper */}
            <div className="flex items-center justify-center gap-4 pb-4">
              {steps.map((label, index) => {
                const isActive = index === currentStep;
                const isDone = index < currentStep;
                const baseCircle =
                  "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold";
                const circleClass = isActive
                  ? "bg-orange-500 text-white border-orange-500"
                  : isDone
                    ? "bg-green-500 text-white border-green-500"
                    : "bg-white text-gray-500 border-gray-300";
                return (
                  <div key={label} className="flex items-center gap-3 sm:gap-4">
                    <div className={`${baseCircle} ${circleClass}`}>{isDone ? <Check className="h-4 w-4" /> : index + 1}</div>
                    <span className={`text-sm ${isActive ? "text-gray-900" : "text-gray-500"} whitespace-nowrap hidden sm:inline`}>
                      {label}
                    </span>
                    {index < steps.length - 1 && <div className="h-px w-16 sm:w-28 bg-gray-200" />}
                  </div>
                );
              })}
            </div>

            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-base font-semibold text-gray-800">บอกเราเกี่ยวกับตัวคุณ</p>
                  <p className="text-sm text-gray-500">ข้อมูลเบื้องต้นสำหรับสร้างโปรไฟล์ของคุณ</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">ประเภทเอกสารยืนยันตัวตน</p>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: "citizen_id", label: "บัตรประชาชน" },
                      { value: "passport", label: "Passport" },
                      { value: "g_code", label: "G-code" },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm cursor-pointer ${
                          form.idType === opt.value
                            ? "border-orange-500 bg-orange-50 text-orange-700"
                            : "border-gray-300 text-gray-700 hover:border-orange-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="idType"
                          value={opt.value}
                          checked={form.idType === opt.value}
                          onChange={() => onChange("idType", opt.value)}
                          className="h-4 w-4 text-orange-500 focus:ring-orange-400"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="doc-number" className="block text-sm font-medium text-gray-700">หมายเลขเอกสาร</label>
                  <input
                    id="doc-number"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none text-gray-900"
                    value={form.idNumber}
                    onChange={(e) => onChange("idNumber", e.target.value)}
                    placeholder={form.idType === "citizen_id" ? "เช่น 1100xxxxxxxxx" : "กรอกหมายเลขเอกสาร"}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {form.idType === "citizen_id"
                      ? "บัตรประชาชน 13 หลัก ไม่มีขีดคั่น"
                      : form.idType === "passport"
                        ? "กรอกหมายเลข Passport ของคุณ"
                        : "กรอกหมายเลข G-code ของคุณ"}
                  </p>
                  {fieldErrors.idNumber && <p className="mt-1 text-xs text-red-600">{fieldErrors.idNumber}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">ชื่อ / Name</label>
                    <input
                      id="first-name"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none text-gray-900"
                      value={form.firstName}
                      onChange={(e) => onChange("firstName", e.target.value)}
                      placeholder="กรอกชื่อ / Enter your name"
                    />
                    <p className="mt-1 text-xs text-gray-500">ภาษาไทย สำหรับนักเรียนไทย / English for international students</p>
                    {fieldErrors.firstName && <p className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>}
                  </div>
                  <div>
                    <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">นามสกุล / Surname</label>
                    <input
                      id="last-name"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none text-gray-900"
                      value={form.lastName}
                      onChange={(e) => onChange("lastName", e.target.value)}
                      placeholder="กรอกนามสกุล / Enter your surname"
                    />
                    <p className="mt-1 text-xs text-gray-500">ภาษาไทย สำหรับนักเรียนไทย / English for international students</p>
                    {fieldErrors.lastName && <p className="mt-1 text-xs text-red-600">{fieldErrors.lastName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                    <input
                      id="phone"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none text-gray-900"
                      value={form.phone}
                      onChange={(e) => onChange("phone", e.target.value)}
                      placeholder="0xxxxxxxxx"
                    />
                    <p className="mt-1 text-xs text-gray-500">ตัวอย่าง: 0812345678</p>
                    {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
                  </div>
                  <div>
                    <label htmlFor="birthday" className="block text-sm font-medium text-gray-700">วันเกิด</label>
                    <input
                      id="birthday"
                      type="date"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none text-gray-900"
                      value={form.birthday}
                      onChange={(e) => onChange("birthday", e.target.value)}
                      aria-label="วันเกิด"
                    />
                  </div>
                </div>

                {fieldErrors.pdpa && <p className="text-xs text-red-600">{fieldErrors.pdpa}</p>}
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <p className="text-base font-semibold text-gray-800">ประวัติการศึกษา</p>
                {/** mock curriculum list for selection */}
                {/** ในอนาคตควรดึงจาก API /curricula */}
                {(() => null)()}

                <div>
                  <label className="block text-sm font-medium text-gray-700">ระดับการศึกษา</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none text-gray-900"
                    value={form.educationLevelId}
                    onChange={(e) => onChange("educationLevelId", e.target.value)}
                    aria-label="ระดับการศึกษา"
                  >
                    <option value="">เลือกระดับการศึกษา</option>
                    <option value="1">มัธยมศึกษาตอนปลาย</option>
                    <option value="2">ประกาศนียบัตรวิชาชีพ (ปวช.)</option>
                    <option value="3">ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)</option>
                  </select>
                  {fieldErrors.educationLevelId && <p className="mt-1 text-xs text-red-600">{fieldErrors.educationLevelId}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">ประเภทหลักสูตร</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none text-gray-900"
                    value={form.curriculumTypeId}
                    onChange={(e) => onChange("curriculumTypeId", e.target.value)}
                    aria-label="ประเภทหลักสูตร"
                  >
                    <option value="">เลือกประเภทหลักสูตร</option>
                    <option value="1">หลักสูตรทั่วไป</option>
                    <option value="2">หลักสูตรนานาชาติ</option>
                  </select>
                  {fieldErrors.curriculumTypeId && <p className="mt-1 text-xs text-red-600">{fieldErrors.curriculumTypeId}</p>}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="project-based"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                    checked={form.isProjectBased}
                    onChange={(e) => onChange("isProjectBased", e.target.checked)}
                  />
                  <label htmlFor="project-based" className="text-sm text-gray-700">
                    เป็นหลักสูตร Project-based
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">หลักสูตร (Curriculum)</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none text-gray-900"
                    value={form.curriculumId}
                    onChange={(e) => onChange("curriculumId", e.target.value)}
                    aria-label="หลักสูตร"
                  >
                    <option value="">เลือกหลักสูตร</option>
                    <option value="1">วิทย์-คณิต</option>
                    <option value="2">ศิลป์-คำนวณ</option>
                    <option value="3">ศิลป์-ภาษา</option>
                    <option value="4">เทคโนโลยี/สายอาชีพ</option>
                  </select>
                  {fieldErrors.curriculumId && <p className="mt-1 text-xs text-red-600">{fieldErrors.curriculumId}</p>}
                  <p className="mt-1 text-xs text-gray-500">เลือกหลักสูตรการเรียนที่ตรงกับ Curriculum</p>
                </div>
              </div>
            )}

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className={`flex ${currentStep === 0 ? "justify-end" : "justify-between"} gap-3 pt-2`}>
              {currentStep > 0 && (
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  onClick={handleBack}
                  disabled={submitting}
                >
                  ย้อนกลับ
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-orange-600 disabled:opacity-60"
              >
                {submitting ? "กำลังบันทึก..." : currentStep === steps.length - 1 ? "ส่งข้อมูล" : "ถัดไป"}
              </button>
            </div>
          </form>
        </div>
    </div>

      {showPdpaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-orange-500 text-xl">⚠️</span>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">การยินยอมให้เก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคล (PDPA)</h2>
                <p className="text-sm text-gray-700 mt-2">
                  เว็บไซส์นี้มีการเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลของท่าน
                  เช่น ชื่อ นามสกุล เลขบัตรประชาชน เบอร์โทร หรือ ข้อมูลอื่นๆ เพื่อการใช้งานระบบ
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handlePdpaReject}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                ไม่ยินยอม
              </button>
              <button
                onClick={handlePdpaAccept}
                className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-orange-600"
              >
                ยินยอม
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
