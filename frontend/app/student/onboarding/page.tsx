"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UserInterface } from "@/src/interfaces/IUser";
import { EducationInterface } from "@/src/interfaces/IEducation";

const ALLOWED_LEVELS = [
  "มัธยมศึกษาตอนปลาย (ม.4-ม.6)",
  "อาชีวศึกษา (ปวช.)",
  "อาชีวศึกษา (ปวส.)",
  "GED",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [nameLanguage, setNameLanguage] = useState<"thai" | "english">("thai");
  const [schools, setSchools] = useState<
    {
      id: number;
      name: string;
      schoolTypeId?: number;
      isProjectBased?: boolean;
    }[]
  >([]);
  const [educationLevels, setEducationLevels] = useState<
    { id: number; name: string }[]
  >([]);
  const [schoolTypes, setSchoolTypes] = useState<
    { id: number; name: string }[]
  >([]);
  const [curriculumTypes, setCurriculumTypes] = useState<
    { id: number; name: string }[]
  >([]);
  const [allowedSchoolTypes, setAllowedSchoolTypes] = useState<
    { id: number; name: string }[]
  >([]);
  const [schoolQuery, setSchoolQuery] = useState("");
  const [showSchoolList, setShowSchoolList] = useState(false);
  const [curriculumQuery, setCurriculumQuery] = useState("");
  const [showCurriculumList, setShowCurriculumList] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const [isProjectBasedDisplay, setIsProjectBasedDisplay] = useState<
    boolean | null
  >(null);
  const docTypeOptions = [
    { key: "citizen", label: "บัตรประชาชน", value: "ID Card" },
    { key: "gcode", label: "G-Code", value: "G-Code" },
    { key: "passport", label: "หนังสือเดินทาง", value: "Passport" },
  ];
  const docTypeIdByKey: Record<string, number> = {
    citizen: 1,
    gcode: 2,
    passport: 3,
  };
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

  // State 1: ข้อมูลส่วนตัว (User) - Mapping ตรงกับ backend/entity/users.go
  const [userForm, setUserForm] = useState<UserInterface>({
    FirstNameTH: "",
    LastNameTH: "",
    IDNumber: "",
    IDDocTypeID: undefined,
    Phone: "",
    Birthday: "", // รอรับค่าจาก input type="date"
    Email: "", // อาจจะดึงมาจาก Context หรือ Token ได้
    PDPAConsent: false,
  });

  // State 2: ข้อมูลการศึกษา (Education) - Mapping ตรงกับ backend/entity/education_info.go
  const [eduForm, setEduForm] = useState<EducationInterface>({
    SchoolName: "",
    SchoolID: undefined,
    EducationLevelID: 0,
    SchoolTypeID: undefined,
    CurriculumTypeID: undefined,
    IsProjectBased: false,
    Status: undefined,
    GraduationYear: undefined,
    StartDate: null,
    EndDate: null,
  });

  // โหลด reference ระดับการศึกษา/ประเภท/หลักสูตร (รันครั้งเดียว)
  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const headers: HeadersInit = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const fetchReference = async () => {
      try {
        const [levelsRes, schoolTypesRes, curriculumRes] = await Promise.all([
          fetch(`${API_URL}/reference/education-levels`, { headers }),
          fetch(`${API_URL}/reference/school-types`, { headers }),
          fetch(`${API_URL}/reference/curriculum-types`, { headers }),
        ]);

        const [levelsData, schoolTypesData, curriculumData] = await Promise.all(
          [levelsRes.json(), schoolTypesRes.json(), curriculumRes.json()],
        );

        const levels = Array.isArray(levelsData.items)
          ? levelsData.items
          : levelsData.data;
        const schoolTypesList = Array.isArray(schoolTypesData.items)
          ? schoolTypesData.items
          : schoolTypesData.data;
        const curriculumList = Array.isArray(curriculumData.items)
          ? curriculumData.items
          : curriculumData.data;

        if (Array.isArray(levels)) {
          const filtered = levels.filter((l: any) =>
            ALLOWED_LEVELS.includes(l.name),
          );
          const mapped = filtered.map((l: any, idx: number) => ({
            id: Number(l.id ?? idx + 1),
            name: l.name,
          }));
          setEducationLevels(
            mapped.length
              ? mapped
              : ALLOWED_LEVELS.map((name, idx) => ({ id: idx + 1, name })),
          );
        } else {
          setEducationLevels(
            ALLOWED_LEVELS.map((name, idx) => ({ id: idx + 1, name })),
          );
        }
        if (Array.isArray(schoolTypesList)) {
          setSchoolTypes(
            schoolTypesList.map((t: any, idx: number) => ({
              id: Number(t.id ?? idx + 1),
              name: t.name,
            })),
          );
        }
        if (Array.isArray(curriculumList)) {
          setCurriculumTypes(
            curriculumList.map((c: any, idx: number) => ({
              id: Number(c.id ?? idx + 1),
              name: c.name,
            })),
          );
        }
      } catch (e) {
        console.error("failed to load reference data", e);
      }
    };

    fetchReference();
  }, [API_URL]);

  // กำหนดประเภทโรงเรียนที่แสดงตามระดับการศึกษา
  useEffect(() => {
    const levelName =
      educationLevels.find((l) => l.id === eduForm.EducationLevelID)?.name ||
      "";
    const matchTypes = (names: string[]) =>
      schoolTypes.filter((t) => names.includes(t.name));

    let filtered: { id: number; name: string }[] = schoolTypes;
    if (levelName.includes("GED")) {
      filtered = matchTypes([
        "โรงเรียนนานาชาติ",
        "ต่างประเทศ",
        "Homeschool",
        "โรงเรียนเอกชน",
        "อื่นๆ",
      ]);
    } else if (
      levelName.includes("อาชีวศึกษา") ||
      levelName.includes("ปวช") ||
      levelName.includes("ปวส")
    ) {
      filtered = matchTypes([
        "อาชีวศึกษา (วิทยาลัย/เทคนิค)",
        "โรงเรียนรัฐบาล",
        "โรงเรียนเอกชน",
        "อื่นๆ",
      ]);
    } else if (levelName.includes("มัธยมศึกษาตอนปลาย")) {
      filtered = matchTypes([
        "โรงเรียนรัฐบาล",
        "โรงเรียนเอกชน",
        "โรงเรียนสาธิต",
        "โรงเรียนนานาชาติ",
        "กศน.",
        "อื่นๆ",
      ]);
    }
    setAllowedSchoolTypes(filtered.length ? filtered : schoolTypes);

    // ปรับค่าเลือกประเภทโรงเรียนอัตโนมัติเมื่อเลือกระดับแล้ว
    if (eduForm.EducationLevelID && filtered.length) {
      if (!filtered.some((t) => t.id === eduForm.SchoolTypeID)) {
        setEduForm((prev) => ({
          ...prev,
          SchoolTypeID: filtered[0].id || undefined,
        }));
      }
    } else if (!eduForm.EducationLevelID) {
      // ยังไม่เลือกระดับ ให้ยังไม่บังคับเลือกประเภท
      if (!schoolTypes.some((t) => t.id === eduForm.SchoolTypeID)) {
        setEduForm((prev) => ({ ...prev, SchoolTypeID: undefined }));
      }
    }
  }, [
    educationLevels,
    eduForm.EducationLevelID,
    eduForm.SchoolTypeID,
    schoolTypes,
  ]);

  // โหลดรายชื่อโรงเรียน (ค้นหาตาม query)
  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const headers: HeadersInit = token
      ? { Authorization: `Bearer ${token}` }
      : {};
    const controller = new AbortController();

    const fetchSchools = async () => {
      try {
        const params = new URLSearchParams();
        params.set("limit", "50");
        if (schoolQuery.trim()) params.set("search", schoolQuery.trim());
        if (eduForm.SchoolTypeID)
          params.set("school_type_id", String(eduForm.SchoolTypeID));

        const res = await fetch(
          `${API_URL}/reference/schools?${params.toString()}`,
          {
            headers,
            signal: controller.signal,
          },
        );
        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : data.data;
        if (Array.isArray(items)) {
          setSchools(
            items.map((s: any) => ({
              id: s.id,
              name: s.name,
              schoolTypeId: s.school_type_id ?? s.schoolTypeID,
              isProjectBased: s.is_project_based,
            })),
          );
        }
      } catch (e) {
        if ((e as any).name === "AbortError") return;
        console.error("failed to load schools", e);
      }
    };

    fetchSchools();
    return () => controller.abort();
  }, [API_URL, schoolQuery, eduForm.SchoolTypeID]);

  // Handle Input Change สำหรับ User Form
  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserForm({ ...userForm, [name]: value });
  };

  // Handle Input Change สำหรับ Education Form
  const handleEduChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "SchoolName") {
      setSchoolQuery(value);
      setIsProjectBasedDisplay(null);
    }
    setEduForm({
      ...eduForm,
      [name]: name === "EducationLevelID" ? Number(value) : value,
    });
  };

  const filteredSchools = useMemo(() => {
    return schools.filter((s) => {
      const matchesName = schoolQuery
        ? s.name.toLowerCase().includes(schoolQuery.toLowerCase())
        : true;
      const matchesType = eduForm.SchoolTypeID
        ? s.schoolTypeId === eduForm.SchoolTypeID
        : true;
      return matchesName && matchesType;
    });
  }, [schoolQuery, schools, eduForm.SchoolTypeID]);

  const filteredCurriculums = useMemo(() => {
    const query = curriculumQuery.trim().toLowerCase();
    return curriculumTypes.filter((c) =>
      c.name.toLowerCase().includes(query),
    );
  }, [curriculumQuery, curriculumTypes]);

  useEffect(() => {
    const selected = curriculumTypes.find(
      (c) => c.id === eduForm.CurriculumTypeID,
    );
    if (selected) {
      setCurriculumQuery(selected.name);
    }
  }, [curriculumTypes, eduForm.CurriculumTypeID]);

  const handleSelectSchool = (school: {
    id: number;
    name: string;
    schoolTypeId?: number;
    isProjectBased?: boolean;
  }) => {
    setEduForm({
      ...eduForm,
      SchoolID: school.id,
      SchoolName: school.name,
      SchoolTypeID: school.schoolTypeId || eduForm.SchoolTypeID,
      IsProjectBased: school.isProjectBased ?? eduForm.IsProjectBased,
    });
    setIsProjectBasedDisplay(
      school.isProjectBased !== undefined ? !!school.isProjectBased : null,
    );
    setSchoolQuery(school.name);
    setShowSchoolList(false);
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated.SchoolName;
      return updated;
    });
  };

  const handleCurriculumChange = (value: string) => {
    setCurriculumQuery(value);
    const matched = curriculumTypes.find(
      (c) => c.name.toLowerCase() === value.trim().toLowerCase(),
    );
    setEduForm((prev) => ({
      ...prev,
      CurriculumTypeID: matched ? matched.id : undefined,
    }));
    setShowCurriculumList(true);
  };

  const handleSelectCurriculum = (curriculum: { id: number; name: string }) => {
    setEduForm((prev) => ({ ...prev, CurriculumTypeID: curriculum.id }));
    setCurriculumQuery(curriculum.name);
    setShowCurriculumList(false);
  };

  const selectedDoc =
    docTypeOptions.find(
      (opt) => docTypeIdByKey[opt.key] === userForm.IDDocTypeID,
    ) || null;
  const selectedDocKey = selectedDoc?.key || "default";
  const docMeta = docFieldMeta[selectedDocKey] || docFieldMeta.default;

  // sync แสดงผล project-based เมื่อค่าใน form เปลี่ยน
  useEffect(() => {
    if (
      eduForm.IsProjectBased !== undefined &&
      eduForm.IsProjectBased !== null
    ) {
      setIsProjectBasedDisplay(!!eduForm.IsProjectBased);
    }
  }, [eduForm.IsProjectBased]);

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    const first = userForm.FirstNameTH?.trim() || "";
    const last = userForm.LastNameTH?.trim() || "";
    if (!first) newErrors.FirstNameTH = "กรุณากรอกชื่อ";
    if (!last) newErrors.LastNameTH = "กรุณากรอกนามสกุล";
    if (!userForm.IDDocTypeID) {
      newErrors.IDDocTypeID = "กรุณาเลือกประเภทเอกสารยืนยันตัวตน";
    }
    const idNumber = userForm.IDNumber?.trim() || "";
    if (!idNumber) {
      newErrors.IDNumber = "กรุณากรอกเลขยืนยันตัวตน";
    } else {
      if (selectedDocKey === "citizen" && !/^\d{13}$/.test(idNumber)) {
        newErrors.IDNumber = "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก";
      }
      if (selectedDocKey === "gcode" && !/^[Gg]\d{7}$/.test(idNumber)) {
        newErrors.IDNumber = "G-Code ต้องขึ้นต้นด้วย G ตามด้วยตัวเลข 7 หลัก";
      }
      if (
        selectedDocKey === "passport" &&
        !/^[A-Za-z0-9]{6,15}$/.test(idNumber)
      ) {
        newErrors.IDNumber = "เลขพาสปอร์ตต้องเป็นตัวอักษร/ตัวเลข 6-15 ตัว";
      }
    }
    const isThai = (v: string) => /^[\p{Script=Thai}\s'-]+$/u.test(v);
    const isEng = (v: string) => /^[A-Za-z\s'-]+$/.test(v);
    if (first && last) {
      if (nameLanguage === "thai" && (!isThai(first) || !isThai(last))) {
        newErrors.FirstNameTH = "กรอกเป็นภาษาไทยเท่านั้น";
        newErrors.LastNameTH = "กรอกเป็นภาษาไทยเท่านั้น";
      }
      if (nameLanguage === "english" && (!isEng(first) || !isEng(last))) {
        newErrors.FirstNameTH = "Use English letters only";
        newErrors.LastNameTH = "Use English letters only";
      }
    }
    if (!userForm.Birthday) newErrors.Birthday = "กรุณาเลือกวันเกิด";
    if (!userForm.Phone?.trim()) newErrors.Phone = "กรุณากรอกเบอร์โทรศัพท์";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!eduForm.EducationLevelID)
      newErrors.EducationLevelID = "กรุณาเลือกระดับการศึกษา";
    if (!eduForm.SchoolName?.trim() && !eduForm.SchoolID)
      newErrors.SchoolName = "กรุณาเลือกหรือกรอกชื่อโรงเรียน";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    }
  };

  const handleBack = () => setStep(1);

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    if (!userForm.PDPAConsent) {
      setErrors((prev) => ({ ...prev, PDPAConsent: "กรุณายินยอม PDPA" }));
      return;
    }

    // รวมข้อมูลเตรียมส่ง Backend
    const useThai = nameLanguage === "thai";
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      // อัปเดตข้อมูลผู้ใช้/PDPA/ชื่อ และ ID
      await fetch(`${API_URL}/users/me/onboarding`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          first_name_th: useThai ? userForm.FirstNameTH : "",
          last_name_th: useThai ? userForm.LastNameTH : "",
          first_name_en: useThai ? "" : userForm.FirstNameTH,
          last_name_en: useThai ? "" : userForm.LastNameTH,
          id_number: userForm.IDNumber,
          id_type_name: selectedDoc?.value ?? docTypeOptions[0].value,
          phone: userForm.Phone,
          birthday: userForm.Birthday || "",
          pdpa_consent: true,
        }),
      });

      // อัปเดตข้อมูลการศึกษา
      await fetch(`${API_URL}/users/me/education`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          education_level_id: eduForm.EducationLevelID,
          school_id: eduForm.SchoolID ?? null,
          school_name: eduForm.SchoolID ? undefined : eduForm.SchoolName,
          school_type_id: eduForm.SchoolTypeID ?? null,
          curriculum_type_id: eduForm.CurriculumTypeID ?? null,
          is_project_based: eduForm.IsProjectBased ?? null,
        }),
      });

      router.replace("/student/home");
    } catch (err) {
      console.error("submit onboarding failed", err);
      alert("ไม่สามารถบันทึกข้อมูลได้ กรุณาลองอีกครั้ง");
    }

    return;

    const payload = {
      user: {
        ...userForm,
        FirstNameTH: useThai ? userForm.FirstNameTH : "",
        LastNameTH: useThai ? userForm.LastNameTH : "",
        FirstNameEN: useThai ? "" : userForm.FirstNameTH,
        LastNameEN: useThai ? "" : userForm.LastNameTH,
        // แปลงวันที่หากจำเป็น (Backend Go รับ time.Time อาจต้องส่งเป็น ISO String)
        Birthday: userForm.Birthday
          ? new Date(userForm.Birthday as string).toISOString()
          : null,
      },
      education: {
        ...eduForm,
        // กำหนด school_id เป็น null ถ้าเป็นโรงเรียนที่พิมพ์เอง (Custom School)
        SchoolID: eduForm.SchoolID ?? null,
      },
    };

    console.log("🚀 Ready to submit payload:", payload);

    // TODO: เรียก API ยิงไป Backend
    // try {
    //   await axios.put('/users/profile', payload.user);
    //   await axios.post('/education', payload.education);
    //   router.push("/student/profile");
    // } catch (error) { ... }

    // จำลองว่าสำเร็จแล้วไปหน้า Profile
    router.push("/student/profile");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 py-12 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-3xl border border-orange-100 overflow-hidden">
        {/* Header */}
        <div className="text-center px-8 pt-10 pb-6 border-b border-orange-100">
          <h2 className="text-3xl font-bold text-gray-900">
            ยินดีต้อนรับเข้าสู่ระบบ
          </h2>
          <p className="mt-2 text-sm text-gray-700">
            กรุณากรอกข้อมูลเบื้องต้นเพื่อเริ่มต้นใช้งาน
          </p>
          <div className="mt-4 flex justify-center items-center space-x-2">
            <div
              className={`h-2 w-10 rounded-full ${step >= 1 ? "bg-orange-500" : "bg-gray-300"}`}
            ></div>
            <div
              className={`h-2 w-10 rounded-full ${step >= 2 ? "bg-orange-500" : "bg-gray-300"}`}
            ></div>
          </div>
        </div>

        <div className="px-8 py-10 space-y-8">
          {/* --- STEP 1: ข้อมูลส่วนตัว --- */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  1. ข้อมูลส่วนตัว
                </h3>
                <p className="text-xs text-gray-600">
                  ภาษาไทย หรือ ภาษาอังกฤษ เลือกอย่างใดอย่างหนึ่ง
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900">
                    เอกสารยืนยันตัวตน
                  </label>
                  <div className="inline-flex rounded-full bg-gray-100 p-1 gap-1">
                    {docTypeOptions.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() =>
                          setUserForm((prev) => ({
                            ...prev,
                            IDDocTypeID: docTypeIdByKey[opt.key],
                          }))
                        }
                        className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                          docTypeIdByKey[opt.key] === userForm.IDDocTypeID
                            ? "bg-white shadow text-orange-600"
                            : "text-gray-700"
                        }`}
                      >
                        <span role="img" aria-label={opt.label}>
                          🪪
                        </span>{" "}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {errors.IDDocTypeID && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.IDDocTypeID}
                    </p>
                  )}
                  <div className="mt-3">
                    <label
                      htmlFor="IDNumber"
                      className="block text-sm font-medium text-gray-900"
                    >
                      {docMeta.label}
                    </label>
                    <input
                      id="IDNumber"
                      name="IDNumber"
                      value={userForm.IDNumber}
                      onChange={handleUserChange}
                      className={`mt-1 block w-full border ${errors.IDNumber ? "border-red-400" : "border-gray-300"} rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900`}
                      placeholder={docMeta.placeholder}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {docMeta.helper}
                    </p>
                    {errors.IDNumber && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.IDNumber}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-gray-800">
                    เลือกภาษาที่กรอกชื่อ:
                  </span>
                  <div className="inline-flex rounded-full bg-gray-100 p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => setNameLanguage("thai")}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                        nameLanguage === "thai"
                          ? "bg-white shadow text-orange-600"
                          : "text-gray-700"
                      }`}
                    >
                      <span role="img" aria-label="thai">
                        📝
                      </span>{" "}
                      ภาษาไทย
                    </button>
                    <button
                      type="button"
                      onClick={() => setNameLanguage("english")}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                        nameLanguage === "english"
                          ? "bg-white shadow text-orange-600"
                          : "text-gray-700"
                      }`}
                    >
                      <span role="img" aria-label="english">
                        ✒️
                      </span>{" "}
                      English
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="FirstNameTH"
                    className="block text-sm font-medium text-gray-900"
                  >
                    ชื่อ *
                  </label>
                  <input
                    id="FirstNameTH"
                    name="FirstNameTH"
                    value={userForm.FirstNameTH}
                    onChange={handleUserChange}
                    className={`mt-1 block w-full border ${errors.FirstNameTH ? "border-red-400" : "border-gray-300"} rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900`}
                    placeholder="กรุณากรอกชื่อ"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ภาษาไทย สำหรับนักเรียนไทย / English for international
                    students
                  </p>
                  {errors.FirstNameTH && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.FirstNameTH}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="LastNameTH"
                    className="block text-sm font-medium text-gray-900"
                  >
                    นามสกุล *
                  </label>
                  <input
                    id="LastNameTH"
                    name="LastNameTH"
                    value={userForm.LastNameTH}
                    onChange={handleUserChange}
                    className={`mt-1 block w-full border ${errors.LastNameTH ? "border-red-400" : "border-gray-300"} rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900`}
                    placeholder="กรุณากรอกนามสกุล"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ภาษาไทย สำหรับนักเรียนไทย / English for international
                    students
                  </p>
                  {errors.LastNameTH && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.LastNameTH}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="Birthday"
                      className="block text-sm font-medium text-gray-900"
                    >
                      วันเกิด (Birthday) *
                    </label>
                    <input
                      id="Birthday"
                      type="date"
                      name="Birthday"
                      value={userForm.Birthday}
                      onChange={handleUserChange}
                      className={`mt-1 block w-full border ${errors.Birthday ? "border-red-400" : "border-gray-300"} rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900`}
                    />
                    {errors.Birthday && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.Birthday}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="Phone"
                      className="block text-sm font-medium text-gray-900"
                    >
                      เบอร์โทรศัพท์ (Phone) *
                    </label>
                    <input
                      id="Phone"
                      type="tel"
                      name="Phone"
                      value={userForm.Phone}
                      onChange={handleUserChange}
                      className={`mt-1 block w-full border ${errors.Phone ? "border-red-400" : "border-gray-300"} rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900`}
                      placeholder="0XXXXXXXXX"
                    />
                    {errors.Phone && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.Phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleNext}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
              >
                ถัดไป (Next)
              </button>
            </div>
          )}

          {/* --- STEP 2: ข้อมูลการศึกษา --- */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    2. ข้อมูลการศึกษา
                  </h3>
                  <p className="text-xs text-gray-600">
                    จำเป็นต้องมีสำหรับการสมัครเรียน
                  </p>
                </div>
                <button
                  onClick={handleBack}
                  className="text-sm text-orange-500 hover:underline"
                >
                  กลับไปแก้ไข
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="EducationLevelID"
                    className="block text-sm font-medium text-gray-900"
                  >
                    ระดับการศึกษา *
                  </label>
                  <select
                    id="EducationLevelID"
                    name="EducationLevelID"
                    value={eduForm.EducationLevelID}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setEduForm((prev) => ({
                        ...prev,
                        EducationLevelID: val,
                        SchoolID: undefined,
                        SchoolName: "",
                        IsProjectBased: false,
                      }));
                      setSchoolQuery("");
                      setIsProjectBasedDisplay(null);
                    }}
                    className={`mt-1 block w-full bg-white border ${errors.EducationLevelID ? "border-red-400" : "border-gray-300"} rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900`}
                  >
                    <option key="placeholder" value={0}>
                      -- กรุณาเลือก --
                    </option>
                    {educationLevels.map((level, idx) => (
                      <option key={`level-${level.id}-${idx}`} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                  {errors.EducationLevelID && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.EducationLevelID}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="SchoolTypeID"
                    className="block text-sm font-medium text-gray-900"
                  >
                    ประเภทโรงเรียน
                  </label>
                  <select
                    id="SchoolTypeID"
                    name="SchoolTypeID"
                    value={eduForm.SchoolTypeID || 0}
                    onChange={(e) => {
                      const val = Number(e.target.value) || undefined;
                      setEduForm({
                        ...eduForm,
                        SchoolTypeID: val,
                        SchoolID: undefined,
                        SchoolName: "",
                      });
                      setSchoolQuery("");
                      setIsProjectBasedDisplay(null);
                    }}
                    className="mt-1 block w-full bg-white border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  >
                    <option value={0}>-</option>
                    {(allowedSchoolTypes.length
                      ? allowedSchoolTypes
                      : schoolTypes
                    ).map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label
                    htmlFor="SchoolName"
                    className="block text-sm font-medium text-gray-900"
                  >
                    ชื่อสถานศึกษา *
                  </label>
                  <input
                    id="SchoolName"
                    name="SchoolName"
                    value={schoolQuery}
                    onChange={handleEduChange}
                    onFocus={() => setShowSchoolList(true)}
                    className={`mt-1 block w-full border ${errors.SchoolName ? "border-red-400" : "border-gray-300"} rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900`}
                    placeholder="ค้นหาชื่อโรงเรียน..."
                    autoComplete="off"
                  />
                  {showSchoolList && filteredSchools.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full max-h-52 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                      {filteredSchools.map((school, idx) => (
                        <button
                          type="button"
                          key={`school-${school.id}-${idx}`}
                          onMouseDown={() => handleSelectSchool(school)}
                          className="w-full text-left px-4 py-2 hover:bg-orange-50 text-sm text-gray-900"
                        >
                          {school.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                  ค้นหาแล้วเลือกจากระบบ หรือพิมพ์ชื่อเองได้
                  </p>
                  {errors.SchoolName && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.SchoolName}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="CurriculumTypeID"
                    className="block text-sm font-medium text-gray-900"
                  >
                    หลักสูตร
                  </label>
                  <div className="relative">
                    <input
                      id="CurriculumTypeID"
                      name="CurriculumTypeID"
                      value={curriculumQuery}
                      onChange={(e) => handleCurriculumChange(e.target.value)}
                      onFocus={() => setShowCurriculumList(true)}
                      className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                      placeholder="ค้นหาหลักสูตร..."
                      autoComplete="off"
                    />
                    {showCurriculumList && filteredCurriculums.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full max-h-52 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                        {filteredCurriculums.map((curriculum) => (
                          <button
                            type="button"
                            key={curriculum.id}
                            onMouseDown={() =>
                              handleSelectCurriculum(curriculum)
                            }
                            className="w-full text-left px-4 py-2 hover:bg-orange-50 text-sm text-gray-900"
                          >
                            {curriculum.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4">
                <input
                  id="pdpa"
                  type="checkbox"
                  checked={userForm.PDPAConsent || false}
                  onChange={(e) =>
                    setUserForm({ ...userForm, PDPAConsent: e.target.checked })
                  }
                  className="mt-1 h-5 w-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <label
                  htmlFor="pdpa"
                  className="text-sm text-gray-900 leading-6"
                >
                  ข้าพเจ้ายินยอมให้จัดเก็บและใช้ข้อมูลส่วนบุคคลตามนโยบาย PDPA
                  เพื่อการสมัครใช้งานระบบ
                </label>
              </div>
              {errors.PDPAConsent && (
                <p className="text-xs text-red-500">{errors.PDPAConsent}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleBack}
                  className="w-1/3 flex justify-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
                >
                  ย้อนกลับ
                </button>
                <button
                  onClick={handleSubmit}
                  className="w-2/3 flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
