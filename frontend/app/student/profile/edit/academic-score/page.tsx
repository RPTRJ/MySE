"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HttpError,
  ProfileResponse,
  fetchMyProfile,
  upsertAcademicScore,
} from "@/services/profile";
import { uploadFile } from "@/services/upload";

export default function EditAcademicScorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);

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
    if (!Number.isFinite(num)) return 0;
    return num < 0 ? 0 : num;
  };

  const handleTranscriptFileChange = (file: File | null) => {
    if (!file) {
      setTranscriptFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("ขนาดไฟล์ต้องไม่เกิน 10MB");
      return;
    }
    if (file.type !== "application/pdf") {
      alert("รองรับเฉพาะไฟล์ PDF เท่านั้น");
      return;
    }
    setTranscriptFile(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      let transcriptPath = form.transcript_file_path.trim() || undefined;

      if (transcriptFile) {
        // Validate file
        if (transcriptFile.size > 10 * 1024 * 1024) {
          throw new Error("ขนาดไฟล์ต้องไม่เกิน 10MB");
        }
        if (transcriptFile.type !== "application/pdf") {
          throw new Error("รองรับเฉพาะไฟล์ PDF เท่านั้น");
        }
        setUploading(true);
        transcriptPath = await uploadFile(transcriptFile);
        setUploading(false);
      }

      await upsertAcademicScore(token, {
        gpax: parseNumber(form.gpax),
        gpax_semesters: parseNumber(form.gpax_semesters),
        gpa_math: parseNumber(form.gpa_math),
        gpa_science: parseNumber(form.gpa_science),
        gpa_thai: parseNumber(form.gpa_thai),
        gpa_english: parseNumber(form.gpa_english),
        gpa_social: parseNumber(form.gpa_social),
        gpa_total_score: parseNumber(form.gpa_total_score),
        transcript_file_path: transcriptPath,
      });
      router.replace("/student/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถบันทึกคะแนน GPAX ได้");
      setUploading(false);
    } finally {
      setSaving(false);
      setUploading(false);
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
                <label htmlFor="gpax" className="block text-sm font-medium text-gray-900">
                  GPAX
                </label>
                <input
                  id="gpax"
                  type="number"
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.gpax}
                  onChange={(e) => setForm((prev) => ({ ...prev, gpax: e.target.value }))}
                  placeholder="0.00 - 4.00"
                />
              </div>
              <div>
                <label htmlFor="gpax_semesters" className="block text-sm font-medium text-gray-900">
                  จำนวนเทอม
                </label>
                <input
                  id="gpax_semesters"
                  type="number"
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.gpax_semesters}
                  onChange={(e) => setForm((prev) => ({ ...prev, gpax_semesters: e.target.value }))}
                  placeholder="จำนวนภาคเรียนที่คิดคำนวณ"
                />
              </div>
              <div>
                <label htmlFor="gpa_total_score" className="block text-sm font-medium text-gray-900">
                  คะแนนรวม (GPA Total)
                </label>
                <input
                  id="gpa_total_score"
                  type="number"
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.gpa_total_score}
                  onChange={(e) => setForm((prev) => ({ ...prev, gpa_total_score: e.target.value }))}
                  placeholder="คะแนนรวมถ้ามี"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="gpa_math" className="block text-sm font-medium text-gray-900">
                  คณิตศาสตร์
                </label>
                <input
                  id="gpa_math"
                  type="number"
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.gpa_math}
                  onChange={(e) => setForm((prev) => ({ ...prev, gpa_math: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="gpa_science" className="block text-sm font-medium text-gray-900">
                  วิทยาศาสตร์
                </label>
                <input
                  id="gpa_science"
                  type="number"
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.gpa_science}
                  onChange={(e) => setForm((prev) => ({ ...prev, gpa_science: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="gpa_thai" className="block text-sm font-medium text-gray-900">
                  ภาษาไทย
                </label>
                <input
                  id="gpa_thai"
                  type="number"
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.gpa_thai}
                  onChange={(e) => setForm((prev) => ({ ...prev, gpa_thai: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="gpa_english" className="block text-sm font-medium text-gray-900">
                  ภาษาอังกฤษ
                </label>
                <input
                  id="gpa_english"
                  type="number"
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.gpa_english}
                  onChange={(e) => setForm((prev) => ({ ...prev, gpa_english: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="gpa_social" className="block text-sm font-medium text-gray-900">
                  สังคมศึกษา
                </label>
                <input
                  id="gpa_social"
                  type="number"
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.gpa_social}
                  onChange={(e) => setForm((prev) => ({ ...prev, gpa_social: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label htmlFor="transcript_file" className="block text-sm font-medium text-gray-900">
                อัพโหลดไฟล์ Transcript (PDF เท่านั้น)
              </label>
              <div className="mt-1">
                <input
                  id="transcript_file"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => handleTranscriptFileChange(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-900
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-orange-50 file:text-orange-700
                    hover:file:bg-orange-100
                    cursor-pointer"
                />
                <p className="mt-1 text-xs text-gray-500">รองรับเฉพาะไฟล์ PDF (ขนาดไม่เกิน 10MB)</p>
                {uploading && (
                  <div className="mt-2 flex items-center text-sm text-orange-600">
                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" aria-label="กำลังอัพโหลด">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    กำลังอัพโหลด...
                  </div>
                )}
                {transcriptFile && (
                  <div className="mt-2 flex items-center text-sm text-green-600">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    เลือกไฟล์: {transcriptFile.name}
                  </div>
                )}
                {!transcriptFile && form.transcript_file_path && (
                  <div className="mt-2 text-sm">
                    <a
                      href={form.transcript_file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-500 hover:underline inline-flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      ดูไฟล์ปัจจุบัน
                    </a>
                  </div>
                )}
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
                disabled={saving || uploading}
                className="w-2/3 flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors disabled:opacity-60"
              >
                {saving ? "กำลังบันทึก..." : uploading ? "กำลังอัพโหลด..." : "บันทึกการเปลี่ยนแปลง"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
