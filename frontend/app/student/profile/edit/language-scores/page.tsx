"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiLanguageScore,
  HttpError,
  ProfileResponse,
  fetchMyProfile,
  replaceLanguageScores,
} from "@/services/profile";

type LanguageItem = {
  test_type: string;
  score?: string;
  test_level?: string;
  test_date?: string;
  cert_file_path?: string;
  sat_math?: string;
};

const emptyItem: LanguageItem = {
  test_type: "",
  score: "",
  test_level: "",
  test_date: "",
  cert_file_path: "",
  sat_math: "",
};

const toDateInput = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

export default function EditLanguageScoresPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<LanguageItem[]>([emptyItem]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    fetchMyProfile(token)
      .then((profile: ProfileResponse) => {
        if (profile.language_scores?.length) {
          setItems(
            profile.language_scores.map((score: ApiLanguageScore) => ({
              test_type: score.test_type || "",
              score: score.score || "",
              test_level: score.test_level || "",
              test_date: toDateInput(score.test_date),
              cert_file_path: score.cert_file_path || "",
              sat_math:
                score.sat_math !== undefined && score.sat_math !== null ? String(score.sat_math) : "",
            })),
          );
        }
      })
      .catch((err: unknown) => {
        if (err instanceof HttpError && err.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลได้");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleChange = (index: number, key: keyof LanguageItem, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }]);

  const removeItem = (index: number) => {
    setItems((prev) => {
      if (prev.length === 1) return [{ ...emptyItem }];
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    const payloadItems = items
      .filter((item) => item.test_type.trim())
      .map((item) => ({
        test_type: item.test_type.trim(),
        score: item.score?.trim() || "",
        test_level: item.test_level?.trim() || "",
        test_date: item.test_date ? `${item.test_date}T00:00:00Z` : undefined,
        cert_file_path: item.cert_file_path?.trim() || "",
        sat_math: item.sat_math ? Number(item.sat_math) : undefined,
      }));

    setSaving(true);
    try {
      await replaceLanguageScores(token, { items: payloadItems });
      router.replace("/student/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถบันทึกคะแนนภาษาได้");
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
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl shadow-md border border-orange-100 p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold text-gray-900">แก้ไขคะแนนภาษา</div>
              <div className="text-xs text-orange-500">ข้อมูลตรงกับเอนทิตี language_proficiency_score.go</div>
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

          <form className="space-y-4" onSubmit={handleSubmit}>
            {items.map((item, index) => (
              <div
                key={`lang-${index}`}
                className="border border-orange-100 rounded-xl p-4 bg-orange-50/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-800">รายการที่ {index + 1}</div>
                  {items.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      ลบรายการ
                    </button>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900">ประเภทการสอบ *</label>
                    <input
                      className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                      value={item.test_type}
                      onChange={(e) => handleChange(index, "test_type", e.target.value)}
                      placeholder="เช่น TGAT, IELTS, TOEFL, SAT"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900">ระดับ</label>
                    <input
                      className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                      value={item.test_level}
                      onChange={(e) => handleChange(index, "test_level", e.target.value)}
                      placeholder="เช่น 5.5 / Band / Level"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900">คะแนน</label>
                    <input
                      className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                      value={item.score}
                      onChange={(e) => handleChange(index, "score", e.target.value)}
                      placeholder="ระบุคะแนนรวม"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900">SAT Math (ถ้ามี)</label>
                    <input
                      type="number"
                      className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                      value={item.sat_math}
                      onChange={(e) => handleChange(index, "sat_math", e.target.value)}
                      placeholder="เช่น 650"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900">วันที่สอบ</label>
                    <input
                      type="date"
                      className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                      value={item.test_date}
                      onChange={(e) => handleChange(index, "test_date", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900">ไฟล์แนบ (ลิงก์หรือ path)</label>
                  <input
                    className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                    value={item.cert_file_path}
                    onChange={(e) => handleChange(index, "cert_file_path", e.target.value)}
                    placeholder="/uploads/language-score.pdf"
                  />
                </div>
              </div>
            ))}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 rounded-xl border border-orange-200 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100"
              >
                + เพิ่มรายการคะแนนภาษา
              </button>
              <span className="text-xs text-gray-500">ปล่อยว่างทุกช่องเพื่อเคลียร์รายการเดิม</span>
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
