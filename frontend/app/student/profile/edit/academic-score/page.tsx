"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HttpError,
  ProfileResponse,
  fetchMyProfile,
  upsertAcademicScore,
} from "@/services/profile";

export default function EditAcademicScorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    gpax: "",
    gpax_semesters: "",
    gpa_math: "",
    gpa_science: "",
    gpa_thai: "",
    gpa_english: "",
    gpa_social: "",
    gpa_total_score: "",
    transcript_file_path: "",
  });

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    fetchMyProfile(token)
      .then((profile: ProfileResponse) => {
        const academic = profile.academic_score;
        if (academic) {
          setForm({
            gpax: academic.gpax !== undefined && academic.gpax !== null ? String(academic.gpax) : "",
            gpax_semesters:
              academic.gpax_semesters !== undefined && academic.gpax_semesters !== null
                ? String(academic.gpax_semesters)
                : "",
            gpa_math: academic.gpa_math !== undefined && academic.gpa_math !== null ? String(academic.gpa_math) : "",
            gpa_science:
              academic.gpa_science !== undefined && academic.gpa_science !== null ? String(academic.gpa_science) : "",
            gpa_thai: academic.gpa_thai !== undefined && academic.gpa_thai !== null ? String(academic.gpa_thai) : "",
            gpa_english:
              academic.gpa_english !== undefined && academic.gpa_english !== null
                ? String(academic.gpa_english)
                : "",
            gpa_social:
              academic.gpa_social !== undefined && academic.gpa_social !== null ? String(academic.gpa_social) : "",
            gpa_total_score:
              academic.gpa_total_score !== undefined && academic.gpa_total_score !== null
                ? String(academic.gpa_total_score)
                : "",
            transcript_file_path: academic.transcript_file_path || "",
          });
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

  const parseNumber = (value: string) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    setSaving(true);
    try {
      await upsertAcademicScore(token, {
        gpax: parseNumber(form.gpax),
        gpax_semesters: parseNumber(form.gpax_semesters),
        gpa_math: parseNumber(form.gpa_math),
        gpa_science: parseNumber(form.gpa_science),
        gpa_thai: parseNumber(form.gpa_thai),
        gpa_english: parseNumber(form.gpa_english),
        gpa_social: parseNumber(form.gpa_social),
        gpa_total_score: parseNumber(form.gpa_total_score),
        transcript_file_path: form.transcript_file_path.trim() || undefined,
      });
      router.replace("/student/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถบันทึกคะแนน GPAX ได้");
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl shadow-md border border-orange-100 p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold text-gray-900">แก้ไขคะแนนหลักสูตรแกนกลาง / GPAX</div>
              <div className="text-xs text-orange-500">ข้อมูลตรงกับเอนทิตี academic_scores.go</div>
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

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900">GPAX</label>
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.gpax}
                  onChange={(e) => setForm((prev) => ({ ...prev, gpax: e.target.value }))}
                  placeholder="0.00 - 4.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">จำนวนเทอม</label>
                <input
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.gpax_semesters}
                  onChange={(e) => setForm((prev) => ({ ...prev, gpax_semesters: e.target.value }))}
                  placeholder="จำนวนภาคเรียนที่คิดคำนวณ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">คะแนนรวม (GPA Total)</label>
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.gpa_total_score}
                  onChange={(e) => setForm((prev) => ({ ...prev, gpa_total_score: e.target.value }))}
                  placeholder="คะแนนรวมถ้ามี"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900">คณิตศาสตร์</label>
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.gpa_math}
                  onChange={(e) => setForm((prev) => ({ ...prev, gpa_math: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">วิทยาศาสตร์</label>
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.gpa_science}
                  onChange={(e) => setForm((prev) => ({ ...prev, gpa_science: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">ภาษาไทย</label>
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.gpa_thai}
                  onChange={(e) => setForm((prev) => ({ ...prev, gpa_thai: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">ภาษาอังกฤษ</label>
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.gpa_english}
                  onChange={(e) => setForm((prev) => ({ ...prev, gpa_english: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">สังคมศึกษา</label>
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.gpa_social}
                  onChange={(e) => setForm((prev) => ({ ...prev, gpa_social: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">ไฟล์ Transcript (ลิงก์หรือ path)</label>
              <input
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                value={form.transcript_file_path}
                onChange={(e) => setForm((prev) => ({ ...prev, transcript_file_path: e.target.value }))}
                placeholder="/uploads/transcript.pdf"
              />
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
