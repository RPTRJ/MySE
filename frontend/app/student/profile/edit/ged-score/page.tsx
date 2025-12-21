"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HttpError, ProfileResponse, fetchMyProfile, upsertGEDScore } from "@/services/profile";

export default function EditGEDScorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    total_score: "",
    rla_score: "",
    math_score: "",
    science_score: "",
    social_score: "",
    cert_file_path: "",
  });

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    fetchMyProfile(token)
      .then((profile: ProfileResponse) => {
        const ged = profile.ged_score;
        if (ged) {
          setForm({
            total_score: ged.total_score !== undefined && ged.total_score !== null ? String(ged.total_score) : "",
            rla_score: ged.rla_score !== undefined && ged.rla_score !== null ? String(ged.rla_score) : "",
            math_score: ged.math_score !== undefined && ged.math_score !== null ? String(ged.math_score) : "",
            science_score:
              ged.science_score !== undefined && ged.science_score !== null ? String(ged.science_score) : "",
            social_score: ged.social_score !== undefined && ged.social_score !== null ? String(ged.social_score) : "",
            cert_file_path: ged.cert_file_path || "",
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
      await upsertGEDScore(token, {
        total_score: parseNumber(form.total_score),
        rla_score: parseNumber(form.rla_score),
        math_score: parseNumber(form.math_score),
        science_score: parseNumber(form.science_score),
        social_score: parseNumber(form.social_score),
        cert_file_path: form.cert_file_path.trim() || undefined,
      });
      router.replace("/student/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถบันทึกคะแนน GED ได้");
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
              <div className="text-lg font-semibold text-gray-900">แก้ไขคะแนน GED</div>
              <div className="text-xs text-orange-500">ข้อมูลตรงกับเอนทิตี ged_scores.go</div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900">คะแนนรวม</label>
                <input
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.total_score}
                  onChange={(e) => setForm((prev) => ({ ...prev, total_score: e.target.value }))}
                  placeholder="เช่น 660"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">Reasoning (RLA)</label>
                <input
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.rla_score}
                  onChange={(e) => setForm((prev) => ({ ...prev, rla_score: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">Math</label>
                <input
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.math_score}
                  onChange={(e) => setForm((prev) => ({ ...prev, math_score: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">Science</label>
                <input
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.science_score}
                  onChange={(e) => setForm((prev) => ({ ...prev, science_score: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">Social Studies</label>
                <input
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.social_score}
                  onChange={(e) => setForm((prev) => ({ ...prev, social_score: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">ไฟล์ใบรับรอง (ลิงก์หรือ path)</label>
              <input
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                value={form.cert_file_path}
                onChange={(e) => setForm((prev) => ({ ...prev, cert_file_path: e.target.value }))}
                placeholder="/uploads/ged-cert.pdf"
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
