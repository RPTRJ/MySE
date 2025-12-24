"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  createCurriculumType,
  createEducationLevel,
  createSchool,
  createSchoolType,
  deleteCurriculumType,
  deleteEducationLevel,
  deleteSchool,
  deleteSchoolType,
  fetchCurriculumTypes,
  fetchEducationLevels,
  fetchSchoolTypes,
  fetchSchools,
  type CurriculumTypeDTO,
  type EducationLevelDTO,
  type SchoolDTO,
  type SchoolTypeDTO,
} from "@/services/education";

type ProjectFilter = "all" | "project" | "standard";

export default function AdminEducationPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [levels, setLevels] = useState<EducationLevelDTO[]>([]);
  const [schoolTypes, setSchoolTypes] = useState<SchoolTypeDTO[]>([]);
  const [curriculumTypes, setCurriculumTypes] = useState<CurriculumTypeDTO[]>([]);
  const [schools, setSchools] = useState<SchoolDTO[]>([]);

  const [selectedSchoolTypeId, setSelectedSchoolTypeId] = useState<number | null>(null);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("all");

  const [loadingSchools, setLoadingSchools] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    message: string;
    onConfirm: (() => Promise<void>) | null;
    working: boolean;
  }>({
    open: false,
    message: "",
    onConfirm: null,
    working: false,
  });
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkForm, setBulkForm] = useState({
    levelId: null as number | null,
    levelName: "",
    schoolTypeId: null as number | null,
    schoolTypeName: "",
    curriculumTypeId: null as number | null,
    curriculumTypeName: "",
    curriculumSchoolTypeId: null as number | null,
    schoolId: null as number | null,
    schoolName: "",
    schoolCode: "",
    isProjectBased: false,
  });
  const [allowedSchoolTypes, setAllowedSchoolTypes] = useState<SchoolTypeDTO[]>([]);

  // --- Auth guard ---
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (!token || !userStr) {
      router.push("/login");
      return;
    }
    try {
      const user = JSON.parse(userStr);
      if (user.type_id !== 3) {
        toast.error("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
        router.push("/");
        return;
      }
      setIsAuthorized(true);
    } catch {
      router.push("/login");
    }
  }, [router]);

  // --- Loaders ---
  const loadLevels = useCallback(async () => {
    try {
      const data = await fetchEducationLevels();
      setLevels(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "โหลดระดับการศึกษาไม่สำเร็จ");
    }
  }, []);

  const loadSchoolTypes = useCallback(async () => {
    try {
      const data = await fetchSchoolTypes();
      setSchoolTypes(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "โหลดประเภทสถานศึกษาไม่สำเร็จ");
    }
  }, []);

  const loadCurriculumTypes = useCallback(async () => {
    try {
      const data = await fetchCurriculumTypes(selectedSchoolTypeId ?? undefined);
      setCurriculumTypes(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "โหลดประเภทหลักสูตรไม่สำเร็จ");
    }
  }, [selectedSchoolTypeId]);

  const loadSchools = useCallback(async () => {
    setLoadingSchools(true);
    try {
      const resp = await fetchSchools({
        search: schoolSearch,
        school_type_id: selectedSchoolTypeId ?? undefined,
        is_project_based: projectFilter === "all" ? null : projectFilter === "project",
        limit: 200,
      });
      setSchools(resp.items);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "โหลดข้อมูลสถานศึกษาไม่สำเร็จ");
    } finally {
      setLoadingSchools(false);
    }
  }, [projectFilter, schoolSearch, selectedSchoolTypeId]);

  useEffect(() => {
    if (!isAuthorized) return;
    loadLevels();
    loadSchoolTypes();
  }, [isAuthorized, loadLevels, loadSchoolTypes]);

  useEffect(() => {
    if (!isAuthorized) return;
    loadCurriculumTypes();
  }, [isAuthorized, loadCurriculumTypes]);

  useEffect(() => {
    if (!isAuthorized) return;
    const timer = setTimeout(() => {
      loadSchools();
    }, 300);
    return () => clearTimeout(timer);
  }, [isAuthorized, loadSchools]);

  const filteredCurriculumTypes = useMemo(() => {
    if (!selectedSchoolTypeId) return curriculumTypes;
    return curriculumTypes.filter((c) => !c.school_type_id || c.school_type_id === selectedSchoolTypeId);
  }, [curriculumTypes, selectedSchoolTypeId]);

  const handleSelectSchoolType = (id: number) => {
    setSelectedSchoolTypeId((prev) => (prev === id ? null : id));
  };

  const confirmDelete = (message: string, action: () => Promise<void>) => {
    setConfirmState({
      open: true,
      message,
      working: false,
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, working: true }));
        try {
          await action();
          setConfirmState({ open: false, message: "", onConfirm: null, working: false });
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "ลบข้อมูลไม่สำเร็จ");
          setConfirmState((prev) => ({ ...prev, working: false }));
        }
      },
    });
  };

  // Allowed school types based on education level (same logic as onboarding)
  const computeAllowedSchoolTypes = useCallback(
    (levelId: number | null): SchoolTypeDTO[] => {
      if (!levelId) return schoolTypes;
      const level = levels.find((l) => l.id === levelId);
      if (!level) return schoolTypes;
      const name = level.name;
      if (name === "มัธยมศึกษาตอนปลาย (ม.4-ม.6)") {
        return schoolTypes.filter((st) =>
          ["โรงเรียนรัฐบาล", "โรงเรียนเอกชน", "โรงเรียนสาธิต", "โรงเรียนนานาชาติ"].includes(st.name)
        );
      }
      if (name === "อาชีวศึกษา (ปวช.)" || name === "อาชีวศึกษา (ปวส.)") {
        return schoolTypes.filter((st) => st.name === "อาชีวศึกษา (วิทยาลัย/เทคนิค)");
      }
      if (name === "GED") {
        return schoolTypes.filter((st) => ["โรงเรียนนานาชาติ", "ต่างประเทศ", "Homeschool"].includes(st.name));
      }
      return schoolTypes;
    },
    [levels, schoolTypes]
  );

  useEffect(() => {
    const allowed = computeAllowedSchoolTypes(bulkForm.levelId);
    setAllowedSchoolTypes(allowed);
    const allowedIds = new Set(allowed.map((s) => s.id));
    setBulkForm((prev) => ({
      ...prev,
      schoolTypeId: prev.schoolTypeId && !allowedIds.has(prev.schoolTypeId) ? null : prev.schoolTypeId,
      curriculumSchoolTypeId:
        prev.curriculumSchoolTypeId && !allowedIds.has(prev.curriculumSchoolTypeId) ? null : prev.curriculumSchoolTypeId,
    }));
  }, [bulkForm.levelId, computeAllowedSchoolTypes]);

  const resetBulkForm = () =>
    setBulkForm({
      levelId: null,
      levelName: "",
      schoolTypeId: null,
      schoolTypeName: "",
      curriculumTypeId: null,
      curriculumTypeName: "",
      curriculumSchoolTypeId: null,
      schoolId: null,
      schoolName: "",
      schoolCode: "",
      isProjectBased: false,
    });

  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkSaving(true);
    setBulkError(null);
    try {
      // 1) Education Level
      let levelId = bulkForm.levelId;
      const levelName = bulkForm.levelName.trim();
      if (!levelId && levelName) {
        const created = await createEducationLevel(levelName);
        levelId = created.id;
      }
      if (!levelId) {
        throw new Error("กรุณาเลือกระดับการศึกษาหรือกรอกชื่อใหม่");
      }

      // 2) School Type
      let schoolTypeId = bulkForm.schoolTypeId;
      const schoolTypeName = bulkForm.schoolTypeName.trim();
      if (!schoolTypeId && schoolTypeName) {
        const created = await createSchoolType(schoolTypeName);
        schoolTypeId = created.id;
      }
      if (!schoolTypeId) {
        throw new Error("กรุณาเลือกหรือกรอกประเภทสถานศึกษา");
      }

      // 3) Curriculum Type
      let curriculumTypeId = bulkForm.curriculumTypeId;
      const curriculumTypeName = bulkForm.curriculumTypeName.trim();
      if (!curriculumTypeId && curriculumTypeName) {
        const created = await createCurriculumType({
          name: curriculumTypeName,
          school_type_id: bulkForm.curriculumSchoolTypeId || schoolTypeId || null,
        });
        curriculumTypeId = created.id;
      }
      if (!curriculumTypeId) {
        throw new Error("กรุณาเลือกหรือกรอกประเภทหลักสูตร");
      }

      // 4) School
      let schoolId = bulkForm.schoolId;
      const schoolName = bulkForm.schoolName.trim();
      if (!schoolId && schoolName) {
        if (!schoolTypeId) {
          throw new Error("กรุณาเลือกประเภทสถานศึกษาสำหรับโรงเรียน");
        }
        const created = await createSchool({
          name: schoolName,
          code: bulkForm.schoolCode.trim() || undefined,
          school_type_id: schoolTypeId,
          is_project_based: bulkForm.isProjectBased,
        });
        schoolId = created.id;
      }
      if (!schoolId) {
        throw new Error("กรุณาเลือกหรือกรอกสถานศึกษา");
      }

      toast.success("เพิ่มข้อมูลชุดใหม่เรียบร้อย");
      resetBulkForm();
      setBulkModalOpen(false);
      await Promise.all([loadLevels(), loadSchoolTypes(), loadCurriculumTypes(), loadSchools()]);
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBulkSaving(false);
    }
  };

  // Filtered options for bulk modal
  const allowedSchoolTypeIds = useMemo(() => new Set(allowedSchoolTypes.map((s) => s.id)), [allowedSchoolTypes]);
  const filteredSchoolTypeOptions = useMemo(
    () => (allowedSchoolTypes.length ? allowedSchoolTypes : schoolTypes),
    [allowedSchoolTypes, schoolTypes]
  );
  const filteredCurriculumOptions = useMemo(() => {
    return curriculumTypes.filter((ct) => {
      if (ct.school_type_id && allowedSchoolTypeIds.size && !allowedSchoolTypeIds.has(ct.school_type_id)) {
        return false;
      }
      if (bulkForm.curriculumSchoolTypeId) {
        return !ct.school_type_id || ct.school_type_id === bulkForm.curriculumSchoolTypeId;
      }
      return true;
    });
  }, [allowedSchoolTypeIds, bulkForm.curriculumSchoolTypeId, curriculumTypes]);

  const filteredSchoolOptions = useMemo(() => {
    return schools.filter((s) => {
      if (allowedSchoolTypeIds.size && !allowedSchoolTypeIds.has(s.school_type_id)) return false;
      if (bulkForm.schoolTypeId && s.school_type_id !== bulkForm.schoolTypeId) return false;
      return true;
    });
  }, [allowedSchoolTypeIds, bulkForm.schoolTypeId, schools]);
  const hasLevel = useMemo(() => Boolean(bulkForm.levelId || bulkForm.levelName.trim()), [bulkForm.levelId, bulkForm.levelName]);

  if (!isAuthorized) {
    return null;
  }

  const selectedSchoolTypeName = selectedSchoolTypeId
    ? schoolTypes.find((s) => s.id === selectedSchoolTypeId)?.name
    : null;

  return (
    <>
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-amber-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-wide text-orange-500 font-semibold">Admin · Education Data</p>
            <h1 className="text-3xl font-bold text-gray-800">จัดการข้อมูลการศึกษา</h1>
          </div>
          <div className="flex items-center gap-3">
            {selectedSchoolTypeName && (
              <div className="rounded-full bg-white shadow px-4 py-2 text-sm text-orange-700 border border-orange-200">
                กำลังกรองตามประเภท: <strong>{selectedSchoolTypeName}</strong>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setBulkError(null);
                setBulkModalOpen(true);
                setBulkForm((prev) => ({
                  ...prev,
                  schoolTypeId: selectedSchoolTypeId ?? prev.schoolTypeId,
                  curriculumSchoolTypeId: selectedSchoolTypeId ?? prev.curriculumSchoolTypeId,
                }));
              }}
              className="px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600"
            >
              เพิ่มข้อมูลเชื่อมโยง
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Education Levels */}
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-orange-600">ระดับการศึกษา</h2>
                <p className="text-gray-500 text-sm">ข้อมูลต้นน้ำที่นักเรียนใช้เลือกในแบบฟอร์ม</p>
              </div>
            </div>
            <div className="text-sm text-gray-500 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
              เพิ่ม/แก้ไขผ่านปุ่ม “เพิ่มข้อมูลเชื่อมโยง” ด้านบน
            </div>
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
              {levels.map((level) => (
                <div key={level.id} className="flex items-center justify-between px-3 py-2">
                  <div className="text-gray-800">{level.name}</div>
                  <div className="flex gap-2 text-sm">
                    <button
                      onClick={() =>
                        confirmDelete("ต้องการลบระดับการศึกษานี้หรือไม่?", async () => {
                          await deleteEducationLevel(level.id);
                          toast.success("ลบระดับการศึกษาแล้ว");
                          loadLevels();
                        })
                      }
                      className="px-3 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              ))}
              {levels.length === 0 && <div className="px-3 py-4 text-gray-500 text-sm">ยังไม่มีข้อมูล</div>}
            </div>
          </div>

          {/* School Types */}
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-orange-600">ประเภทสถานศึกษา</h2>
                <p className="text-gray-500 text-sm">เลือกหนึ่งรายการเพื่อกรองข้อมูลที่เกี่ยวข้องในคอลัมน์ถัดไป</p>
              </div>
            </div>
            <div className="text-sm text-gray-500 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
              เพิ่ม/แก้ไขผ่านปุ่ม “เพิ่มข้อมูลเชื่อมโยง” ด้านบน
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {schoolTypes.map((item) => {
                const isSelected = selectedSchoolTypeId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border px-3 py-3 cursor-pointer transition ${
                      isSelected ? "border-orange-400 bg-orange-50" : "border-gray-100 bg-gray-50 hover:border-orange-200"
                    }`}
                    onClick={() => handleSelectSchoolType(item.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-500">{isSelected ? "กำลังเชื่อมโยงข้อมูลทั้งหมด" : "คลิกเพื่อเลือก"}</p>
                      </div>
                      <div className="flex gap-2 text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete("ต้องการลบประเภทสถานศึกษานี้หรือไม่?", async () => {
                              await deleteSchoolType(item.id);
                              toast.success("ลบประเภทสถานศึกษาแล้ว");
                              if (selectedSchoolTypeId === item.id) {
                                setSelectedSchoolTypeId(null);
                              }
                              await loadSchoolTypes();
                              await loadCurriculumTypes();
                              await loadSchools();
                            });
                          }}
                          className="px-2 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {schoolTypes.length === 0 && <div className="text-gray-500 text-sm">ยังไม่มีข้อมูล</div>}
            </div>
          </div>
        </section>

        {/* Linked columns */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Curriculum types */}
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-orange-600">ประเภทหลักสูตร (Curriculum Track)</h2>
                <p className="text-gray-500 text-sm">เชื่อมโยงกับประเภทสถานศึกษา (ถ้าไม่ได้เลือก จะถือว่าใช้ได้ทุกประเภท)</p>
              </div>
            </div>
            <div className="text-sm text-gray-500 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
              เพิ่ม/แก้ไขผ่านปุ่ม “เพิ่มข้อมูลเชื่อมโยง” ด้านบน
            </div>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {filteredCurriculumTypes.map((item) => (
                <div key={item.id} className="border border-gray-100 rounded-xl px-3 py-3 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.school_type?.name || (item.school_type_id ? "ระบุประเภทโรงเรียน" : "ใช้ได้ทุกประเภท")}
                      </p>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <button
                        onClick={() =>
                          confirmDelete("ต้องการลบประเภทหลักสูตรนี้หรือไม่?", async () => {
                            await deleteCurriculumType(item.id);
                            toast.success("ลบประเภทหลักสูตรแล้ว");
                            loadCurriculumTypes();
                          })
                        }
                        className="px-3 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredCurriculumTypes.length === 0 && <div className="text-gray-500 text-sm">ไม่มีข้อมูลสำหรับประเภทที่เลือก</div>}
            </div>
          </div>

          {/* Schools */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-orange-100 p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-orange-600">สถานศึกษา</h2>
                <p className="text-gray-500 text-sm">
                  จัดการรายชื่อโรงเรียน/วิทยาลัย พร้อมกรองตามประเภทและ Project-based
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <input
                  type="text"
                  value={schoolSearch}
                  onChange={(e) => setSchoolSearch(e.target.value)}
                  placeholder="ค้นหาชื่อหรือรหัส"
                  className="rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <select
                  aria-label="ตัวกรองสถานศึกษา Project-based"
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value as ProjectFilter)}
                  className="rounded-lg border border-gray-200 px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="all">แสดงทั้งหมด</option>
                  <option value="project">เฉพาะ Project-based</option>
                  <option value="standard">เฉพาะ Non Project-based</option>
                </select>
                <button
                  onClick={() => {
                    setSchoolSearch("");
                    setProjectFilter("all");
                    loadSchools();
                  }}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-orange-400"
                >
                  รีเฟรช
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-500 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 mb-2">
              เพิ่ม/แก้ไขผ่านปุ่ม “เพิ่มข้อมูลเชื่อมโยง” ด้านบน
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {loadingSchools ? (
                <div className="text-center text-gray-500 col-span-2 py-6">กำลังโหลดข้อมูล...</div>
              ) : (
                schools.map((school) => (
                  <div key={school.id} className="border border-gray-100 rounded-xl px-4 py-3 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-800">{school.name}</p>
                          {school.code && (
                            <span className="text-xs text-gray-500 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                              {school.code}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {school.school_type?.name || "ไม่ระบุประเภท"} ·{" "}
                          {school.is_project_based ? "Project-based" : "Standard"}
                        </p>
                      </div>
                      <div className="flex gap-2 text-sm">
                        <button
                          onClick={() =>
                            confirmDelete("ต้องการลบสถานศึกษานี้หรือไม่?", async () => {
                              await deleteSchool(school.id);
                              toast.success("ลบสถานศึกษาแล้ว");
                              loadSchools();
                            })
                          }
                          className="px-3 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {!loadingSchools && schools.length === 0 && (
                <div className="text-gray-500 text-sm col-span-2">ไม่พบสถานศึกษาที่ตรงกับเงื่อนไข</div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
    {/* Bulk add modal */}
    {bulkModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-orange-500 font-semibold">Add Linked Dataset</p>
              <h3 className="text-xl font-bold text-gray-800">เพิ่มข้อมูลเชื่อมโยงครั้งเดียว</h3>
              <p className="text-gray-500 text-sm">เลือกระดับการศึกษา → ประเภทสถานศึกษา → ประเภทหลักสูตร → โรงเรียน/วิทยาลัย แล้วบันทึกในคลิกเดียว</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setBulkModalOpen(false);
                resetBulkForm();
              }}
              className="text-gray-500 hover:text-orange-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleBulkCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">ระดับการศึกษา</label>
                <select
                  aria-label="เลือกระดับการศึกษา"
                  value={bulkForm.levelId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBulkForm((prev) => ({ ...prev, levelId: val ? Number(val) : null }));
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-800"
                >
                  <option value="">เลือกจากเดิม</option>
                  {levels.map((lvl) => (
                    <option key={lvl.id} value={lvl.id}>
                      {lvl.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={bulkForm.levelName}
                  onChange={(e) => setBulkForm((prev) => ({ ...prev, levelName: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-white text-gray-800"
                  placeholder="หรือกรอกชื่อใหม่"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">ประเภทสถานศึกษา</label>
                <select
                  aria-label="เลือกประเภทสถานศึกษา"
                  value={bulkForm.schoolTypeId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBulkForm((prev) => ({
                      ...prev,
                      schoolTypeId: val ? Number(val) : null,
                      curriculumSchoolTypeId: val ? Number(val) : prev.curriculumSchoolTypeId,
                    }));
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-800 disabled:bg-gray-100"
                  disabled={!hasLevel}
                >
                  <option value="">เลือกจากเดิม</option>
                  {filteredSchoolTypeOptions.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={bulkForm.schoolTypeName}
                  onChange={(e) => setBulkForm((prev) => ({ ...prev, schoolTypeName: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-white text-gray-800 disabled:bg-gray-100"
                  placeholder="หรือกรอกชื่อใหม่"
                  disabled={!hasLevel}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">ประเภทหลักสูตร (Curriculum Track)</label>
                <select
                  aria-label="เลือกประเภทหลักสูตร"
                  value={bulkForm.curriculumTypeId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBulkForm((prev) => ({ ...prev, curriculumTypeId: val ? Number(val) : null }));
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-800 disabled:bg-gray-100"
                  disabled={!hasLevel}
                >
                  <option value="">เลือกจากเดิม</option>
                  {filteredCurriculumOptions.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.name} {ct.school_type?.name ? `(${ct.school_type.name})` : ""}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={bulkForm.curriculumTypeName}
                  onChange={(e) => setBulkForm((prev) => ({ ...prev, curriculumTypeName: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-white text-gray-800 disabled:bg-gray-100"
                  placeholder="หรือกรอกชื่อหลักสูตรใหม่"
                  disabled={!hasLevel}
                />
                <select
                  aria-label="กำหนดประเภทโรงเรียนที่ใช้ได้กับหลักสูตร"
                  value={bulkForm.curriculumSchoolTypeId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBulkForm((prev) => ({ ...prev, curriculumSchoolTypeId: val ? Number(val) : null }));
                  }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-white text-gray-800 disabled:bg-gray-100"
                  disabled={!hasLevel}
                >
                  <option value="">ใช้ได้ทุกประเภทโรงเรียน</option>
                  {filteredSchoolTypeOptions.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">สถานศึกษา</label>
                <select
                  aria-label="เลือกสถานศึกษา"
                  value={bulkForm.schoolId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBulkForm((prev) => ({ ...prev, schoolId: val ? Number(val) : null }));
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-800 disabled:bg-gray-100"
                  disabled={!hasLevel}
                >
                  <option value="">เลือกจากเดิม</option>
                  {filteredSchoolOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.code ? `(${s.code})` : ""}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={bulkForm.schoolName}
                  onChange={(e) => setBulkForm((prev) => ({ ...prev, schoolName: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-white text-gray-800 disabled:bg-gray-100"
                  placeholder="หรือกรอกชื่อสถานศึกษาใหม่"
                  disabled={!hasLevel}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={bulkForm.schoolCode}
                    onChange={(e) => setBulkForm((prev) => ({ ...prev, schoolCode: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-white text-gray-800 disabled:bg-gray-100"
                    placeholder="รหัส (ถ้ามี)"
                    disabled={!hasLevel}
                  />
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={bulkForm.isProjectBased}
                    onChange={(e) => setBulkForm((prev) => ({ ...prev, isProjectBased: e.target.checked }))}
                    className="h-4 w-4 text-orange-500 border-gray-300 rounded"
                    disabled={!hasLevel}
                  />
                  Project-based
                </label>
              </div>
            </div>

            {bulkError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{bulkError}</div>}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setBulkModalOpen(false);
                  resetBulkForm();
                  setBulkError(null);
                }}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                disabled={bulkSaving}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-400 text-gray-900 font-semibold hover:bg-amber-500 disabled:opacity-70"
                disabled={bulkSaving}
              >
                {bulkSaving ? "กำลังบันทึก..." : "บันทึกข้อมูลชุดใหม่"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Confirm modal */}
    {confirmState.open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">ยืนยันการทำรายการ</h3>
          <p className="text-gray-600 leading-relaxed">{confirmState.message}</p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setConfirmState({ open: false, message: "", onConfirm: null, working: false })}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              disabled={confirmState.working}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={() => confirmState.onConfirm && confirmState.onConfirm()}
              className="px-4 py-2 rounded-lg bg-amber-400 text-gray-900 font-semibold hover:bg-amber-500 disabled:opacity-70"
              disabled={confirmState.working}
            >
              {confirmState.working ? "กำลังดำเนินการ..." : "ยืนยัน"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
