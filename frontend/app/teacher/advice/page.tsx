/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createAdvice,
  createCourse,
  createSkill,
  deleteAdvice,
  deleteCourse,
  deleteSkill,
  fetchAdvices,
  fetchCourses,
  fetchSkills,
  updateAdvice,
  updateCourse,
  updateSkill,
  type AdviceDTO,
  type CourseDTO,
  type SkillDTO,
} from "@/services/advice";
import { BookOpen, CheckCircle, Layers, Plus, Sparkles, Wand2, Trash2, Pencil } from "lucide-react";
import toast from "react-hot-toast";

type SkillFormState = {
  skill_name_th: string;
  skill_name_en: string;
  category: string;
  description: string;
};

type CourseFormState = {
  course_code: string;
  course_name_th: string;
  course_name_en: string;
  credits: string;
  category: string;
  description: string;
};

type AdviceFormState = {
  program_code: string;
  program_name_th: string; // ชื่อคำแนะนำ/หลักสูตร (TH)
  program_name_en: string; // ชื่อคำแนะนำ/หลักสูตร (EN)
  description: string;
  is_active: boolean;
};

const initialSkillForm: SkillFormState = {
  skill_name_th: "",
  skill_name_en: "",
  category: "",
  description: "",
};

const initialCourseForm: CourseFormState = {
  course_code: "",
  course_name_th: "",
  course_name_en: "",
  credits: "",
  category: "",
  description: "",
};

const initialAdviceForm: AdviceFormState = {
  program_code: "",
  program_name_th: "",
  program_name_en: "",
  description: "",
  is_active: true,
};

export default function TeacherAdvicePage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [teacherName, setTeacherName] = useState("อาจารย์");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [skills, setSkills] = useState<SkillDTO[]>([]);
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [advices, setAdvices] = useState<AdviceDTO[]>([]);

  const [skillForm, setSkillForm] = useState<SkillFormState>(initialSkillForm);
  const [courseForm, setCourseForm] = useState<CourseFormState>(initialCourseForm);
  const [adviceForm, setAdviceForm] = useState<AdviceFormState>(initialAdviceForm);
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [editingSkillId, setEditingSkillId] = useState<number | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [editingAdviceId, setEditingAdviceId] = useState<number | null>(null);
  type DeleteTarget = { type: "advice" | "skill" | "course"; id: number; label: string };
  const [confirmDelete, setConfirmDelete] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;

    if (!token || !userStr) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.type_id !== 2) {
        toast.error("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
        router.push("/");
        return;
      }
      const displayName =
        user.first_name_th && user.last_name_th
          ? `${user.first_name_th} ${user.last_name_th}`
          : `${user.first_name_en || ""} ${user.last_name_en || ""}`.trim() || "อาจารย์";
      setTeacherName(displayName);
      setIsAuthorized(true);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthorized) return;
    (async () => {
      try {
        setLoading(true);
        const [skillData, courseData, adviceData] = await Promise.all([
          fetchSkills(),
          fetchCourses(),
          fetchAdvices(),
        ]);
        setSkills(skillData);
        setCourses(courseData);
        setAdvices(adviceData);
      } catch (err) {
        console.error(err);
        toast.error("โหลดข้อมูลคำแนะนำไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthorized]);

  const skillCount = useMemo(() => skills.length, [skills]);
  const courseCount = useMemo(() => courses.length, [courses]);

  const toggleSkillSelection = (id: number) => {
    setSelectedSkillIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleCourseSelection = (id: number) => {
    setSelectedCourseIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleCreateOrUpdateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillForm.skill_name_th && !skillForm.skill_name_en) {
      toast.error("กรอกชื่อทักษะอย่างน้อยหนึ่งภาษา");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...skillForm,
        category: Number(skillForm.category || 0),
      };
      if (editingSkillId) {
        const updated = await updateSkill(editingSkillId, payload);
        setSkills((prev) => prev.map((s) => (s.id === editingSkillId ? updated : s)));
        toast.success("อัปเดตทักษะสำเร็จ");
      } else {
        const created = await createSkill(payload);
        setSkills((prev) => [...prev, created]);
        toast.success("บันทึกทักษะสำเร็จ");
      }
      setSkillForm(initialSkillForm);
      setEditingSkillId(null);
    } catch (err) {
      console.error(err);
      toast.error("ไม่สามารถบันทึก/อัปเดตทักษะได้");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateOrUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.course_code || !courseForm.course_name_th) {
      toast.error("กรอกโค้ดและชื่อรายวิชา");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...courseForm,
        credits: Number(courseForm.credits || 0),
        category: Number(courseForm.category || 0),
      };
      if (editingCourseId) {
        const updated = await updateCourse(editingCourseId, payload);
        setCourses((prev) => prev.map((c) => (c.id === editingCourseId ? updated : c)));
        toast.success("อัปเดตรายวิชาสำเร็จ");
      } else {
        const created = await createCourse(payload);
        setCourses((prev) => [...prev, created]);
        toast.success("บันทึกรายวิชาสำเร็จ");
      }
      setCourseForm(initialCourseForm);
      setEditingCourseId(null);
    } catch (err) {
      console.error(err);
      toast.error("ไม่สามารถบันทึก/อัปเดตรายวิชาได้");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateOrUpdateAdvice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adviceForm.program_code || !adviceForm.program_name_th) {
      toast.error("กรอกชื่อคำแนะนำและโค้ดให้ครบ");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...adviceForm,
        skill_ids: selectedSkillIds,
        course_ids: selectedCourseIds,
      };
      if (editingAdviceId) {
        const updated = await updateAdvice(editingAdviceId, payload);
        setAdvices((prev) => prev.map((a) => (a.id === editingAdviceId ? updated : a)));
        toast.success("อัปเดตคำแนะนำสำเร็จ");
      } else {
        const created = await createAdvice(payload);
        setAdvices((prev) => [created, ...prev]);
        toast.success("บันทึกคำแนะนำสำเร็จ");
      }
      resetAdviceForm();
    } catch (err) {
      console.error(err);
      toast.error("ไม่สามารถบันทึก/อัปเดตคำแนะนำได้");
    } finally {
      setSaving(false);
    }
  };

  const resetAdviceForm = () => {
    setAdviceForm(initialAdviceForm);
    setSelectedCourseIds([]);
    setSelectedSkillIds([]);
    setEditingAdviceId(null);
  };

  const handleEditAdvice = (advice: AdviceDTO) => {
    setAdviceForm({
      program_code: advice.program_code,
      program_name_th: advice.program_name_th,
      program_name_en: advice.program_name_en,
      description: advice.description || "",
      is_active: advice.is_active ?? true,
    });
    setSelectedSkillIds(advice.skills?.map((s) => s.id) || []);
    setSelectedCourseIds(advice.courses?.map((c) => c.id) || []);
    setEditingAdviceId(advice.id);
  };

  const handleDeleteAdvice = (advice: AdviceDTO) => {
    setConfirmDelete({
      type: "advice",
      id: advice.id,
      label: advice.program_name_th || advice.program_name_en || advice.program_code,
    });
  };

  const handleEditSkill = (skill: SkillDTO) => {
    setSkillForm({
      skill_name_th: skill.skill_name_th,
      skill_name_en: skill.skill_name_en,
      category: String(skill.category || ""),
      description: skill.description || "",
    });
    setEditingSkillId(skill.id);
  };

  const handleDeleteSkill = (skill: SkillDTO) => {
    setConfirmDelete({
      type: "skill",
      id: skill.id,
      label: skill.skill_name_th || skill.skill_name_en || "ทักษะ",
    });
  };

  const handleEditCourse = (course: CourseDTO) => {
    setCourseForm({
      course_code: course.course_code,
      course_name_th: course.course_name_th,
      course_name_en: course.course_name_en,
      credits: String(course.credits || ""),
      category: String(course.category || ""),
      description: course.description || "",
    });
    setEditingCourseId(course.id);
  };

  const handleDeleteCourse = (course: CourseDTO) => {
    setConfirmDelete({
      type: "course",
      id: course.id,
      label: `${course.course_code} ${course.course_name_th || course.course_name_en}`,
    });
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      if (confirmDelete.type === "advice") {
        await deleteAdvice(confirmDelete.id);
        setAdvices((prev) => prev.filter((a) => a.id !== confirmDelete.id));
        if (editingAdviceId === confirmDelete.id) resetAdviceForm();
      } else if (confirmDelete.type === "skill") {
        await deleteSkill(confirmDelete.id);
        setSkills((prev) => prev.filter((s) => s.id !== confirmDelete.id));
        setSelectedSkillIds((prev) => prev.filter((sid) => sid !== confirmDelete.id));
        if (editingSkillId === confirmDelete.id) {
          setSkillForm(initialSkillForm);
          setEditingSkillId(null);
        }
      } else if (confirmDelete.type === "course") {
        await deleteCourse(confirmDelete.id);
        setCourses((prev) => prev.filter((c) => c.id !== confirmDelete.id));
        setSelectedCourseIds((prev) => prev.filter((cid) => cid !== confirmDelete.id));
        if (editingCourseId === confirmDelete.id) {
          setCourseForm(initialCourseForm);
          setEditingCourseId(null);
        }
      }
      toast.success("ลบข้อมูลแล้ว");
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
      toast.error("ลบข้อมูลไม่สำเร็จ");
    } finally {
      setDeleting(false);
    }
  };

  if (!isAuthorized) return null;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-300 p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,_#fff,_transparent_40%)]" />
        <div className="relative flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
            <Sparkles className="h-5 w-5" />
            Advice Builder สำหรับอาจารย์
          </div>
          <h1 className="text-2xl font-bold">เชื่อม “รายวิชา” กับ “ทักษะ” เป็นคำแนะนำเดียว</h1>
          <p className="max-w-3xl text-sm text-orange-50">
            เพิ่มทักษะ สร้างรายวิชา แล้วประกอบเป็นชุดคำแนะนำ (Advice) เพื่อสื่อสารว่าแต่ละรายวิชาควรพัฒนาทักษะอะไรบ้าง
          </p>
          <div className="flex items-center gap-4 text-xs text-orange-50/80">
            <span>อาจารย์: {teacherName}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1">
              <CheckCircle className="h-4 w-4" /> ทักษะ {skillCount} • รายวิชา {courseCount}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-orange-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-orange-100 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">เพิ่มทักษะ</p>
              <p className="text-xs text-gray-500">เก็บรายการทักษะไว้ใช้ซ้ำได้ในทุกคำแนะนำ</p>
            </div>
            <Sparkles className="h-5 w-5 text-orange-500" />
          </div>
          <form className="space-y-3 px-5 py-4" onSubmit={handleCreateOrUpdateSkill}>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700">ชื่อทักษะ (TH)</label>
                <input
                  className="mt-1 w-full rounded-lg border border-orange-100 bg-orange-50/50 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                  value={skillForm.skill_name_th}
                  onChange={(e) => setSkillForm({ ...skillForm, skill_name_th: e.target.value })}
                  placeholder="เช่น การคิดเชิงออกแบบ"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">ชื่อทักษะ (EN)</label>
                <input
                  className="mt-1 w-full rounded-lg border border-orange-100 bg-orange-50/50 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                  value={skillForm.skill_name_en}
                  onChange={(e) => setSkillForm({ ...skillForm, skill_name_en: e.target.value })}
                  placeholder="e.g. Design Thinking"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700">หมวด (ใส่เลขหรือปล่อยว่าง)</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-orange-100 bg-orange-50/50 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                    value={skillForm.category}
                    onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })}
                    placeholder="เช่น 1 หรือเว้นว่าง"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">คำอธิบาย (ทางเลือก)</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-orange-100 bg-orange-50/50 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                    value={skillForm.description}
                    onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })}
                    placeholder="ย่อสั้นๆ"
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {editingSkillId ? "อัปเดตทักษะ" : "บันทึกทักษะ"}
            </button>
            {editingSkillId && (
              <button
                type="button"
                onClick={() => {
                  setSkillForm(initialSkillForm);
                  setEditingSkillId(null);
                }}
                className="w-full rounded-lg border border-orange-200 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
              >
                ยกเลิกการแก้ไข
              </button>
            )}
          </form>
        </div>

        <div className="rounded-xl border border-orange-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-orange-100 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">เพิ่มรายวิชา</p>
              <p className="text-xs text-gray-500">ใส่รหัส ชื่อวิชา เครดิต (หมวดใส่เลขหรือเว้นว่าง)</p>
            </div>
            <BookOpen className="h-5 w-5 text-orange-500" />
          </div>
          <form className="space-y-3 px-5 py-4" onSubmit={handleCreateOrUpdateCourse}>
            <div className="grid grid-cols-1 gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700">รหัสวิชา</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-orange-100 bg-orange-50/50 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                    value={courseForm.course_code}
                    onChange={(e) => setCourseForm({ ...courseForm, course_code: e.target.value })}
                    placeholder="CS101"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">เครดิต</label>
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-lg border border-orange-100 bg-orange-50/50 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                    value={courseForm.credits}
                    onChange={(e) => setCourseForm({ ...courseForm, credits: e.target.value })}
                    placeholder="3"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">ชื่อวิชา (TH)</label>
                <input
                  className="mt-1 w-full rounded-lg border border-orange-100 bg-orange-50/50 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                  value={courseForm.course_name_th}
                  onChange={(e) => setCourseForm({ ...courseForm, course_name_th: e.target.value })}
                  placeholder="โปรแกรมมิ่งเบื้องต้น"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">ชื่อวิชา (EN)</label>
                <input
                  className="mt-1 w-full rounded-lg border border-orange-100 bg-orange-50/50 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                  value={courseForm.course_name_en}
                  onChange={(e) => setCourseForm({ ...courseForm, course_name_en: e.target.value })}
                  placeholder="Introduction to Programming"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700">หมวด (ตัวเลขหรือเว้นว่าง)</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-orange-100 bg-orange-50/50 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                    value={courseForm.category}
                    onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                    placeholder="เช่น 1 หรือเว้นว่าง"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">คำอธิบาย (ทางเลือก)</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-orange-100 bg-orange-50/50 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    placeholder="ย่อสั้นๆ"
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {editingCourseId ? "อัปเดตรายวิชา" : "บันทึกรายวิชา"}
            </button>
            {editingCourseId && (
              <button
                type="button"
                onClick={() => {
                  setCourseForm(initialCourseForm);
                  setEditingCourseId(null);
                }}
                className="w-full rounded-lg border border-orange-200 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
              >
                ยกเลิกการแก้ไข
              </button>
            )}
          </form>
        </div>

        <div className="rounded-xl border border-orange-100 bg-white shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between border-b border-orange-100 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">สรุปสถานะ</p>
              <p className="text-xs text-gray-500">ทักษะ + รายวิชาที่เลือกไว้</p>
            </div>
            <Wand2 className="h-5 w-5 text-orange-500" />
          </div>
          <div className="space-y-3 px-5 py-4">
            <div className="rounded-lg border border-orange-100 bg-orange-50/60 px-4 py-3">
              <p className="text-xs text-gray-500">ทักษะที่เลือก</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedSkillIds.length === 0 && (
                  <span className="text-xs text-gray-400">ยังไม่ได้เลือก</span>
                )}
                {selectedSkillIds.map((id) => {
                  const skill = skills.find((s) => s.id === id);
                  if (!skill) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-orange-700 shadow-sm"
                    >
                      <Layers className="h-3 w-3" />
                      {skill.skill_name_th || skill.skill_name_en}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="rounded-lg border border-orange-100 bg-orange-50/60 px-4 py-3">
              <p className="text-xs text-gray-500">รายวิชาที่เลือก</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedCourseIds.length === 0 && (
                  <span className="text-xs text-gray-400">ยังไม่ได้เลือก</span>
                )}
                {selectedCourseIds.map((id) => {
                  const course = courses.find((c) => c.id === id);
                  if (!course) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-orange-700 shadow-sm"
                    >
                      <BookOpen className="h-3 w-3" />
                      {course.course_code} • {course.course_name_th || course.course_name_en}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-xl border border-orange-100 bg-white shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between border-b border-orange-100 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">สร้างคำแนะนำ (Advice)</p>
              <p className="text-xs text-gray-500">ตั้งชื่อคำแนะนำ เลือกวิชาและทักษะที่เกี่ยวข้อง</p>
            </div>
            <Plus className="h-5 w-5 text-orange-500" />
          </div>
          <form className="space-y-4 px-5 py-4" onSubmit={handleCreateOrUpdateAdvice}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700">รหัสคำแนะนำ/ชุดวิชา</label>
                <input
                  className="mt-1 w-full rounded-lg border border-orange-100 bg-orange-50/50 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                  value={adviceForm.program_code}
                  onChange={(e) => setAdviceForm({ ...adviceForm, program_code: e.target.value })}
                  placeholder="เช่น CPE-ADVICE"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">ชื่อคำแนะนำ (TH)</label>
                <input
                  className="mt-1 w-full rounded-lg border border-orange-100 bg-orange-50/50 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                  value={adviceForm.program_name_th}
                  onChange={(e) => setAdviceForm({ ...adviceForm, program_name_th: e.target.value })}
                  placeholder="เช่น ชุดวิชาพื้นฐานโปรแกรมมิ่ง"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">ชื่อคำแนะนำ (EN)</label>
                <input
                  className="mt-1 w-full rounded-lg border border-orange-100 bg-orange-50/50 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                  value={adviceForm.program_name_en}
                  onChange={(e) => setAdviceForm({ ...adviceForm, program_name_en: e.target.value })}
                  placeholder="e.g. Intro Programming Set"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700">คำอธิบาย</label>
                <input
                  className="mt-1 w-full rounded-lg border border-orange-100 bg-orange-50/50 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                  value={adviceForm.description}
                  onChange={(e) => setAdviceForm({ ...adviceForm, description: e.target.value })}
                  placeholder="รายละเอียดสั้นๆ"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={adviceForm.is_active}
                  onChange={(e) => setAdviceForm({ ...adviceForm, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-orange-300 text-orange-500 focus:ring-orange-400"
                />
                เปิดใช้งานคำแนะนำนี้
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-orange-100 bg-orange-50/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-800">เลือกทักษะ (ติ๊กหลายข้อได้)</p>
                  <span className="text-[11px] text-gray-500">{selectedSkillIds.length} รายการ</span>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {skills.length === 0 && <p className="text-xs text-gray-400">ยังไม่มีทักษะ</p>}
                {skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSkillIds.includes(skill.id)}
                      onChange={() => toggleSkillSelection(skill.id)}
                      className="mt-1 h-4 w-4 rounded border-orange-300 text-orange-500 focus:ring-orange-400"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {skill.skill_name_th || skill.skill_name_en || "ไม่ระบุชื่อ"}
                      </p>
                      <p className="text-xs text-gray-500">{skill.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditSkill(skill)}
                        className="rounded-full border border-orange-200 p-1 text-orange-600 hover:bg-orange-50"
                        title="แก้ไขทักษะ"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSkill(skill)}
                        className="rounded-full border border-red-200 p-1 text-red-600 hover:bg-red-50"
                        title="ลบทักษะ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-orange-100 bg-orange-50/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-800">เลือกรายวิชา (ติ๊กหลายข้อได้)</p>
                <span className="text-[11px] text-gray-500">{selectedCourseIds.length} รายการ</span>
              </div>
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {courses.length === 0 && <p className="text-xs text-gray-400">ยังไม่มีรายวิชา</p>}
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCourseIds.includes(course.id)}
                      onChange={() => toggleCourseSelection(course.id)}
                      className="mt-1 h-4 w-4 rounded border-orange-300 text-orange-500 focus:ring-orange-400"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {course.course_code} • {course.course_name_th || course.course_name_en}
                      </p>
                      <p className="text-xs text-gray-500">
                        เครดิต {course.credits} | หมวด {course.category}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditCourse(course)}
                        className="rounded-full border border-orange-200 p-1 text-orange-600 hover:bg-orange-50"
                        title="แก้ไขรายวิชา"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCourse(course)}
                        className="rounded-full border border-red-200 p-1 text-red-600 hover:bg-red-50"
                        title="ลบรายวิชา"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </div>

            <div className="flex justify-end">
              {editingAdviceId && (
                <button
                  type="button"
                  onClick={resetAdviceForm}
                  className="mr-2 rounded-lg border border-orange-200 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                >
                  ยกเลิกการแก้ไข
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-700 disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                {editingAdviceId ? "อัปเดต Advice" : "สร้าง Advice"}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-xl border border-orange-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-orange-100 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">รายการคำแนะนำ</p>
              <p className="text-xs text-gray-500">แสดงชุดที่สร้างล่าสุด</p>
            </div>
            <Layers className="h-5 w-5 text-orange-500" />
          </div>
          <div className="divide-y divide-orange-50">
            {loading && <p className="px-5 py-4 text-sm text-gray-500">กำลังโหลด...</p>}
            {!loading && advices.length === 0 && (
              <p className="px-5 py-4 text-sm text-gray-500">ยังไม่มีคำแนะนำ</p>
            )}
            {advices.map((advice) => (
              <div key={advice.id} className="px-5 py-4 hover:bg-orange-50/60">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {advice.program_code} • {advice.program_name_th || advice.program_name_en}
                    </p>
                    <p className="text-xs text-gray-500">{advice.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        advice.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {advice.is_active ? "เปิดใช้งาน" : "ปิดอยู่"}
                    </span>
                    <button
                      onClick={() => handleEditAdvice(advice)}
                      className="rounded-full border border-orange-200 p-1 text-orange-600 hover:bg-orange-50"
                      title="แก้ไข"
                      type="button"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAdvice(advice)}
                      className="rounded-full border border-red-200 p-1 text-red-600 hover:bg-red-50"
                      title="ลบ"
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-600">
                  <span className="rounded-full bg-white px-2 py-1 shadow-sm">
                    ทักษะ {advice.skills?.length || 0}
                  </span>
                  <span className="rounded-full bg-white px-2 py-1 shadow-sm">
                    รายวิชา {advice.courses?.length || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal ยืนยันการลบ */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="border-b px-5 py-4">
              <p className="text-sm font-semibold text-gray-900">ยืนยันการลบ</p>
              <p className="text-xs text-gray-500 mt-1">
                คุณต้องการลบ {confirmDelete.label} ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                disabled={deleting}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmDeleteAction}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "กำลังลบ..." : "ตกลง ลบ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
