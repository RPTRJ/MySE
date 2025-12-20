"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchSections } from "@/services/sections";
import { createTemplate } from "@/services/templates";
import { fetchCategoryTemplates } from "@/services/categoryTemplates";
import { uploadImage } from "@/services/upload";

export default function CreateTemplatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    template_name: "",
    category_template_id: 0, // ยังไม่เลือก
    description: "",
    thumbnail: "",
  });
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSections, setSelectedSections] = useState<{id: number, order: number}[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // โหลด sections และ categories พร้อมกัน
        const [sectionsData, categoriesData] = await Promise.all([
          fetchSections(),
          fetchCategoryTemplates()
        ]);
        setSections(sectionsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoadingSections(false);
        setLoadingCategories(false);
      }
    };
    loadData();
  }, []);

  const toggleSection = (sectionId: number) => {
    setSelectedSections(prev => {
      const exists = prev.find(s => s.id === sectionId);
      if (exists) {
        return prev.filter(s => s.id !== sectionId);
      } else {
        return [...prev, { id: sectionId, order: prev.length }];
      }
    });
  };

  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    setSelectedSections(prev => {
      const newArr = [...prev];
      [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
      return newArr.map((item, idx) => ({ ...item, order: idx }));
    });
  };

  const moveSectionDown = (index: number) => {
    if (index === selectedSections.length - 1) return;
    setSelectedSections(prev => {
      const newArr = [...prev];
      [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
      return newArr.map((item, idx) => ({ ...item, order: idx }));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate thumbnail
    if (!formData.thumbnail || formData.thumbnail.trim() === "") {
      alert("กรุณาอัพโหลดรูปภาพหรือใส่ URL รูปภาพ");
      return;
    }

    // Validate sections selection
    if (selectedSections.length < 2) {
      alert("กรุณาเลือก Section อย่างน้อย 2 รายการ");
      return;
    }

    setLoading(true);

    try {
      const templateData = {
        template_name: formData.template_name,
        category_template_id: formData.category_template_id,
        description: formData.description,
        thumbnail: formData.thumbnail,
        section_ids: selectedSections.map(s => s.id),
      };
      
      console.log("Creating template:", templateData);
      
      // เรียก API สร้าง template
      const result = await createTemplate(templateData);
      console.log("Template created:", result);
      
      alert("สร้างเทมเพลตสำเร็จ!");
      router.push("/admin/template");
    } catch (error) {
      console.error("Error creating template:", error);
      alert("เกิดข้อผิดพลาดในการสร้างเทมเพลต: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 relative">
      {/* Sticky Navbar */}
      <div className="sticky top-0 bg-white shadow-md z-40">
        <div className="max-w-7xl px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/admin/template" className="text-gray-600 hover:text-gray-900 transition pb-1">
                Templates
              </Link>
              <Link href="/admin/template/section" className="text-gray-600 hover:text-gray-900 transition pb-1">
                Sections
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 ">
        <div className="mt-4 bg-white rounded-xl shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">สร้างเทมเพลตใหม่</h1>
          <p className="text-gray-600 mt-2">กรอกข้อมูลเพื่อสร้างเทมเพลตพอร์ตโฟลิโอใหม่</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-8">
          <div className="space-y-6">
            {/* Template Name */}
            <div>
              <label htmlFor="template_name" className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อเทมเพลต <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="template_name"
                required
                value={formData.template_name}
                onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="เช่น Professional Portfolio"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.template_name.length}/50 ตัวอักษร
              </p>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category_template_id" className="block text-sm font-medium text-gray-700 mb-2">
                หมวดหมู่ <span className="text-red-500">*</span>
              </label>
              <select
                id="category_template_id"
                required
                value={formData.category_template_id}
                onChange={(e) => setFormData({ ...formData, category_template_id: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                disabled={loadingCategories}
              >
                {loadingCategories ? (
                  <option value="0">กำลังโหลด...</option>
                ) : categories.length === 0 ? (
                  <option value="0">ไม่มีหมวดหมู่</option>
                ) : (
                  <>
                    <option value="0" disabled>เลือกหมวดหมู่</option>
                    {categories.map((category) => (
                      <option key={category.ID} value={category.ID}>
                        {category.category_name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                คำอธิบาย
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                placeholder="อธิบายเกี่ยวกับเทมเพลตนี้..."
                rows={4}
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/100 ตัวอักษร
              </p>
            </div>

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รูปภาพตัวอย่าง <span className="text-red-500">*</span>
              </label>
              
              <input
                type="file"
                id="thumbnail_file"
                accept="image/*"
                required
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  // แสดง preview ทันที
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setFormData({ ...formData, thumbnail: reader.result as string });
                  };
                  reader.readAsDataURL(file);

                  // Upload ไฟล์ไปยัง backend
                  try {
                    const url = await uploadImage(file);
                    setFormData({ ...formData, thumbnail: url });
                  } catch (error) {
                    console.error('Upload error:', error);
                    alert('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />

              <p className="text-xs text-gray-500 mt-2">
                <span className="text-red-500 font-semibold">บังคับ:</span> อัพโหลดไฟล์รูปภาพเท่านั้น (JPG, PNG, GIF, WEBP)
              </p>
              
              {/* Preview */}
              {formData.thumbnail && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">ตัวอย่าง:</p>
                  <div className="w-full h-48 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <img 
                      src={formData.thumbnail} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '';
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sections Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลือก Sections <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                เลือก sections ที่ต้องการเพิ่มในเทมเพลต <span className="font-semibold text-orange-600">(อย่างน้อย 2 sections)</span>
              </p>
              
              {loadingSections ? (
                <div className="text-center py-4 text-gray-500">กำลังโหลด sections...</div>
              ) : (
                <div className="space-y-4">
                  {/* Available Sections */}
                  <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto no-arrow">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Sections ที่มีทั้งหมด</h4>
                    <div className="space-y-2 ">
                      {sections.map((section) => {
                        const isSelected = selectedSections.some(s => s.id === section.ID);
                        return (
                          <label
                            key={section.ID}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                              isSelected ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSection(section.ID)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{section.section_name}</div>
                              <div className="text-xs text-gray-500">
                                {section.section_blocks?.length || 0} blocks
                              </div>
                            </div>
                            {section.layout_type && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                {section.layout_type}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Sections Order */}
                  {selectedSections.length > 0 && (
                    <div className="border border-blue-300 rounded-lg p-4 bg-blue-50">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Sections ที่เลือก ({selectedSections.length})
                      </h4>
                      <p className="text-xs text-gray-600 mb-3">จัดเรียงลำดับการแสดงผล</p>
                      <div className="space-y-2">
                        {selectedSections.map((selected, index) => {
                          const section = sections.find(s => s.ID === selected.id);
                          return (
                            <div
                              key={selected.id}
                              className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-200"
                            >
                              <span className="bg-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                                {index + 1}
                              </span>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 text-sm">{section?.section_name}</div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveSectionUp(index)}
                                  disabled={index === 0}
                                  className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="ย้ายขึ้น"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveSectionDown(index)}
                                  disabled={index === selectedSections.length - 1}
                                  className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="ย้ายลง"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleSection(selected.id)}
                                  className="p-1 text-red-400 hover:text-red-600"
                                  title="ลบ"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  กำลังสร้าง...
                </span>
              ) : (
                "สร้างเทมเพลต"
              )}
            </button>
          </div>
        </form>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex gap-3">
            <div className="text-blue-600 flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">ข้อมูลเพิ่มเติม</h3>
              <p className="text-sm text-blue-800">
                หลังจากสร้างเทมเพลตแล้ว คุณสามารถเพิ่ม Sections และ Blocks เข้าไปในเทมเพลตได้ในภายหลัง
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
