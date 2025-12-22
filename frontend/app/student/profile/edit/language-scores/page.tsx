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
import { uploadFile } from "@/services/upload";

type LanguageItem = {
  test_type: string;
  score?: string;
  test_level?: string;
  test_date?: string;
  cert_file_path?: string;
  cert_file?: File | null;
  sat_math?: string;
};

const emptyItem: LanguageItem = {
  test_type: "",
  score: "",
  test_level: "",
  test_date: "",
  cert_file_path: "",
  cert_file: null,
  sat_math: "",
};

const toDateInput = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const languageTestTypes = [
  "TOEIC",
  "TOEFL iBT",
  "TOEFL ITP",
  "IELTS",
  "SAT",
  "TGAT",
  "TPAT",
  "A-Level",
  "อื่นๆ",
];

export default function EditLanguageScoresPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
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
              cert_file: null,
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

  const handleFileChange = async (index: number, file: File | null) => {
    if (!file) {
      setItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, cert_file: null } : item))
      );
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("ขนาดไฟล์ต้องไม่เกิน 10MB");
      return;
    }

    // Validate file type (accept only PDF)
    if (file.type !== "application/pdf") {
      alert("รองรับเฉพาะไฟล์ PDF เท่านั้น");
      return;
    }

    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, cert_file: file } : item))
    );
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

    // Validate: at least one item must have a test_type
    const validItems = items.filter((item) => item.test_type.trim());
    if (!validItems.length) {
      setError("กรุณากรอกข้อมูลอย่างน้อย 1 รายการ");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Upload files first
      const uploadedItems = await Promise.all(
        validItems.map(async (item, index) => {
          if (item.cert_file) {
            setUploading(index);
            try {
              const uploadedUrl = await uploadFile(item.cert_file);
              setUploading(null);
              return {
                ...item,
                cert_file_path: uploadedUrl,
              };
            } catch (uploadError) {
              setUploading(null);
              throw new Error(`ไม่สามารถอัพโหลดไฟล์สำหรับ ${item.test_type} ได้`);
            }
          }
          return item;
        })
      );

      // Prepare payload
      const payload = {
        items: uploadedItems.map((item) => ({
          test_type: item.test_type.trim(),
          score: item.score?.trim() || "",
          test_level: item.test_level?.trim() || "",
          test_date: item.test_date ? new Date(item.test_date).toISOString() : undefined,
          cert_file_path: item.cert_file_path?.trim() || "",
          sat_math: item.sat_math?.trim() ? Number(item.sat_math) : undefined,
        })),
      };

      await replaceLanguageScores(token, payload);
      router.replace("/student/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setSaving(false);
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-700">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            กลับ
          </button>
        </div>

        {/* คำแนะนำ - ย้ายมาด้านบนและเปลี่ยนสีเป็นสีเหลือง */}
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">คำแนะนำ</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>กรุณาเข้าใจใจไฟล์ผลคะแนนในรูปแบบ PDF เท่านั้น</li>
                  <li>ไฟล์ควรชัดเจน อ่านได้ และมีข้อมูลครบถ้วน</li>
                  <li>ขนาดไฟล์ไม่ควรเกิน 10MB</li>
                  <li>สามารถเพิ่มได้หลายรายการสำหรับคะแนนภาษาต่างประเภท</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-600">
            <h1 className="text-2xl font-bold text-white">แก้ไขข้อมูลคะแนนภาษา</h1>
            <p className="mt-1 text-sm text-orange-100">
              อัพโหลดไฟล์ PDF ของผลคะแนนสอบภาษาต่างๆ
            </p>
          </div>

          {error && (
            <div className="mx-6 mt-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r" role="alert">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-6">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-xl p-5 bg-gray-50 relative"
                >
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-700"
                      title="ลบรายการนี้"
                      aria-label={`ลบรายการที่ ${index + 1}`}
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Test Type */}
                    <div>
                      <label htmlFor={`test-type-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                        ประเภทการสอบ <span className="text-red-500">*</span>
                      </label>
                      <select
                        id={`test-type-${index}`}
                        name={`test-type-${index}`}
                        value={item.test_type}
                        onChange={(e) => handleChange(index, "test_type", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-white"
                        required
                        aria-label={`ประเภทการสอบรายการที่ ${index + 1}`}
                      >
                        <option value="" className="text-gray-500">-- เลือกประเภทการสอบ --</option>
                        {languageTestTypes.map((type) => (
                          <option key={type} value={type} className="text-gray-900">
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Test Level */}
                    <div>
                      <label htmlFor={`test-level-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                        ระดับ
                      </label>
                      <input
                        id={`test-level-${index}`}
                        name={`test-level-${index}`}
                        type="text"
                        value={item.test_level}
                        onChange={(e) => handleChange(index, "test_level", e.target.value)}
                        placeholder="เช่น B2, Intermediate"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                        aria-label={`ระดับรายการที่ ${index + 1}`}
                      />
                    </div>

                    {/* Score */}
                    <div>
                      <label htmlFor={`score-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                        คะแนน
                      </label>
                      <input
                        id={`score-${index}`}
                        name={`score-${index}`}
                        type="text"
                        value={item.score}
                        onChange={(e) => handleChange(index, "score", e.target.value)}
                        placeholder="เช่น 850, 7.5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                        aria-label={`คะแนนรายการที่ ${index + 1}`}
                      />
                    </div>

                    {/* Test Date */}
                    <div>
                      <label htmlFor={`test-date-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                        วันที่สอบ
                      </label>
                      <input
                        id={`test-date-${index}`}
                        name={`test-date-${index}`}
                        type="date"
                        value={item.test_date}
                        onChange={(e) => handleChange(index, "test_date", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                        aria-label={`วันที่สอบรายการที่ ${index + 1}`}
                      />
                    </div>

                    {/* SAT Math (conditional) */}
                    {item.test_type === "SAT" && (
                      <div>
                        <label htmlFor={`sat-math-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                          SAT Math Score
                        </label>
                        <input
                          id={`sat-math-${index}`}
                          name={`sat-math-${index}`}
                          type="number"
                          value={item.sat_math}
                          onChange={(e) => handleChange(index, "sat_math", e.target.value)}
                          placeholder="200-800"
                          min="200"
                          max="800"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                          aria-label={`SAT Math Score รายการที่ ${index + 1}`}
                        />
                      </div>
                    )}

                    {/* File Upload - PDF Only */}
                    <div className={item.test_type === "SAT" ? "" : "md:col-span-2"}>
                      <label htmlFor={`cert-file-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                        อัพโหลดไฟล์ผลคะแนน (PDF เท่านั้น)
                      </label>
                      <div className="mt-1">
                        <input
                          id={`cert-file-${index}`}
                          name={`cert-file-${index}`}
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={(e) => handleFileChange(index, e.target.files?.[0] || null)}
                          className="block w-full text-sm text-gray-900
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-lg file:border-0
                            file:text-sm file:font-semibold
                            file:bg-orange-50 file:text-orange-700
                            hover:file:bg-orange-100
                            cursor-pointer"
                          aria-label={`อัพโหลดไฟล์ผลคะแนนรายการที่ ${index + 1}`}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          รองรับเฉพาะไฟล์ PDF (ขนาดไม่เกิน 10MB)
                        </p>
                        {uploading === index && (
                          <div className="mt-2 flex items-center text-sm text-orange-600">
                            <svg
                              className="animate-spin h-4 w-4 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              aria-label="กำลังอัพโหลด"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            กำลังอัพโหลด...
                          </div>
                        )}
                        {item.cert_file && (
                          <div className="mt-2 flex items-center text-sm text-green-600">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            เลือกไฟล์: {item.cert_file.name}
                          </div>
                        )}
                        {item.cert_file_path && !item.cert_file && (
                          <div className="mt-2 text-sm">
                            <a
                              href={item.cert_file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-500 hover:underline inline-flex items-center"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              ดูไฟล์ปัจจุบัน
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={addItem}
                className="flex items-center px-4 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                aria-label="เพิ่มรายการคะแนนภาษา"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                เพิ่มรายการ
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  disabled={saving}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading !== null}
                  className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg hover:from-orange-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "กำลังบันทึก..." : uploading !== null ? "กำลังอัพโหลด..." : "บันทึก"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}