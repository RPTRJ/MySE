"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HttpError, ProfileResponse, fetchMyProfile, updatePersonalInfo } from "@/services/profile";

const DOC_TYPE_OPTIONS = [
  { key: "citizen", label: "บัตรประชาชน", value: "ID Card" },
  { key: "gcode", label: "G-Code", value: "G-Code" },
  { key: "passport", label: "หนังสือเดินทาง", value: "Passport" },
];

const docFieldMeta: Record<
  string,
  { label: string; placeholder: string; helper: string }
> = {
  citizen: {
    label: "เลขบัตรประชาชน *",
    placeholder: "กรอกเลขบัตรประชาชน 13 หลัก",
    helper: "เลข 13 หลัก (ไม่มีขีด)",
  },
  gcode: {
    label: "หมายเลข G-Code *",
    placeholder: "กรอก G-Code เช่น G1234567",
    helper: "ขึ้นต้นด้วย G ตามด้วยตัวเลข 7 หลัก",
  },
  passport: {
    label: "หมายเลขหนังสือเดินทาง *",
    placeholder: "กรอกหมายเลขหนังสือเดินทาง",
    helper: "ตามหมายเลขบนหน้าหนังสือเดินทาง",
  },
  default: {
    label: "หมายเลขยืนยันตัวตน *",
    placeholder: "กรอกเลขยืนยันตัวตน",
    helper: "เลข 13 หลัก (ไม่มีขีด) หรือรหัสตามเอกสารที่เลือก",
  },
};

const dateToInputValue = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const guessDocTypeKey = (idName?: string) => {
  if (!idName) return "citizen";
  const lowered = idName.toLowerCase();
  if (lowered.includes("passport")) return "passport";
  if (lowered.includes("g")) return "gcode";
  return "citizen";
};

export default function EditPersonalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [nameLanguage, setNameLanguage] = useState<"thai" | "english">("thai");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    birthday: "",
    idNumber: "",
    docTypeKey: "citizen",
  });

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    fetchMyProfile(token)
      .then((data) => {
        setProfile(data);
        const user = data.user;
        setForm({
          firstName: user.first_name_th || user.first_name_en || "",
          lastName: user.last_name_th || user.last_name_en || "",
          phone: user.phone || "",
          birthday: dateToInputValue(user.birthday),
          idNumber: user.id_number || "",
          docTypeKey: guessDocTypeKey(user.user_id_type?.id_name),
        });
        setNameLanguage(user.first_name_th || user.last_name_th ? "thai" : "english");
      })
      .catch((err: unknown) => {
        if (err instanceof HttpError && err.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const selectedDocType = useMemo(
    () => DOC_TYPE_OPTIONS.find((opt) => opt.key === form.docTypeKey) || DOC_TYPE_OPTIONS[0],
    [form.docTypeKey],
  );
  const docMeta = docFieldMeta[selectedDocType.key] || docFieldMeta.default;

  const isThai = (v: string) => /^[\p{Script=Thai}\s'-]+$/u.test(v.trim());
  const isEng = (v: string) => /^[A-Za-z\s'-]+$/.test(v.trim());

  const validate = () => {
    const first = form.firstName.trim();
    const last = form.lastName.trim();
    if (!first || !last) {
      setError("กรุณากรอกชื่อและนามสกุล");
      return false;
    }
    if (nameLanguage === "thai" && (!isThai(first) || !isThai(last))) {
      setError("กรุณากรอกชื่อ-นามสกุลเป็นภาษาไทยเท่านั้น");
      return false;
    }
    if (nameLanguage === "english" && (!isEng(first) || !isEng(last))) {
      setError("Please enter first and last name in English only");
      return false;
    }
    if (!form.idNumber.trim()) {
      setError("กรุณากรอกหมายเลขเอกสารยืนยันตัวตน");
      return false;
    }
    if (!form.phone.trim()) {
      setError("กรุณากรอกหมายเลขโทรศัพท์");
      return false;
    }
    if (!form.birthday) {
      setError("กรุณาเลือกวันเกิด");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    setSaving(true);
    try {
      await updatePersonalInfo(token, {
        first_name_th: nameLanguage === "thai" ? form.firstName : "",
        last_name_th: nameLanguage === "thai" ? form.lastName : "",
        first_name_en: nameLanguage === "english" ? form.firstName : "",
        last_name_en: nameLanguage === "english" ? form.lastName : "",
        id_number: form.idNumber,
        id_type_name: selectedDocType.value,
        phone: form.phone,
        birthday: form.birthday,
        pdpa_consent: true,
      });
      router.replace("/student/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-amber-50 text-gray-700">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl shadow-md border border-orange-100 p-6 sm:p-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xl font-semibold text-gray-900">ข้อมูลส่วนตัว</div>
              <div className="text-xs text-gray-600">ปรับให้ตรงกับฟอร์ม onboarding</div>
            </div>
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm text-orange-500 hover:underline px-3 py-1 rounded-full bg-orange-50"
            >
              ย้อนกลับ
            </button>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <div>
                <span className="block text-sm font-medium text-gray-900">เอกสารยืนยันตัวตน</span>
                <div className="inline-flex rounded-full bg-gray-100 p-1 gap-1 mt-2">
                  {DOC_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, docTypeKey: opt.key }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                        opt.key === form.docTypeKey ? "bg-white shadow text-orange-600" : "text-gray-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="idNumber" className="block text-sm font-medium text-gray-900">{docMeta.label}</label>
                <input
                  id="idNumber"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.idNumber}
                  onChange={(e) => setForm((prev) => ({ ...prev, idNumber: e.target.value }))}
                  placeholder={docMeta.placeholder}
                />
                <p className="text-xs text-gray-500 mt-1">{docMeta.helper}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-gray-800">เลือกภาษาที่ใช้บันทึกชื่อ:</span>
              <div className="inline-flex rounded-full bg-gray-100 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setNameLanguage("thai")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                    nameLanguage === "thai" ? "bg-white shadow text-orange-600" : "text-gray-700"
                  }`}
                >
                  📝 ภาษาไทย
                </button>
                <button
                  type="button"
                  onClick={() => setNameLanguage("english")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                    nameLanguage === "english" ? "bg-white shadow text-orange-600" : "text-gray-700"
                  }`}
                >
                  ✒️ English
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-900">ชื่อ *</label>
                <input
                  id="firstName"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.firstName}
                  onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  placeholder={nameLanguage === "thai" ? "กรอกชื่อเป็นภาษาไทย" : "Enter first name"}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-900">นามสกุล *</label>
                <input
                  id="lastName"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.lastName}
                  onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  placeholder={nameLanguage === "thai" ? "กรอกนามสกุลเป็นภาษาไทย" : "Enter last name"}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-900">หมายเลขโทรศัพท์ *</label>
                <input
                  id="phone"
                  type="tel"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="0XXXXXXXXX"
                />
              </div>
              <div>
                <label htmlFor="birthday" className="block text-sm font-medium text-gray-900">วันเกิด *</label>
                <input
                  id="birthday"
                  type="date"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.birthday}
                  onChange={(e) => setForm((prev) => ({ ...prev, birthday: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push("/student/profile")}
                className="w-1/3 flex justify-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving}
                className="w-2/3 flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors disabled:opacity-60"
              >
                {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
