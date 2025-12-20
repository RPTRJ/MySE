"use client";

import { useEffect, useState } from "react";
import { Template } from "@/src/interfaces/template";
import { fetchTemplates } from "@/services/templates";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    try {
      const data = await fetchTemplates();
      
      const sortedData = data.map((template: Template) => ({
        ...template,
        template_section_links: template.template_section_links
          ?.sort((a, b) => a.order_index - b.order_index)
          .map((link) => ({
            ...link,
            templates_section: link.templates_section
              ? {
                  ...link.templates_section,
                  section_blocks: link.templates_section.section_blocks
                    ?.sort((a, b) => a.order_index - b.order_index),
                }
              : undefined,
          })),
      }));
      
      setTemplates(sortedData);
      setLoading(false);
    } catch (err) {
      console.error("Error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white-50 relative">
      {/* Sticky Navbar */}
      <div className="sticky top-0 bg-white shadow-md z-40">
        <div className="max-w-7xl px-6">
          <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-6">
                <Link href="/admin/template" className="text-blue-600 font-medium hover:text-blue-700 transition border-b-2 border-blue-600 pb-1">
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
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8 mt-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Portfolio Templates</h1>
            <p className="text-gray-600 mt-2">เลือกเทมเพลตที่ต้องการสำหรับพอร์ตโฟลิโอของคุณ</p>
          </div>
          <button 
            onClick={() => router.push('/admin/template/create')}
            className="rounded-lg bg-gray-400 px-6 py-3 text-sm font-medium text-white hover:bg-orange-500 transition shadow-md hover:shadow-lg"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              สร้างเทมเพลตใหม่
            </span>
          </button>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.ID}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden group flex flex-col"
              onClick={() => setSelectedTemplate(template)}
            >
              <div className="h-48 flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
                {template.thumbnail ? (
                  <img
                    src={template.thumbnail}
                    alt={template.template_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white text-6xl font-bold opacity-20">
                    {template.template_name.charAt(0)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                  <button className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 px-4 py-2 rounded-lg font-medium transition-all transform scale-90 group-hover:scale-100">
                    ดูรายละเอียด
                  </button>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{template.template_name}</h3>
                  {template.category && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      {template.category}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
                  {template.description || "ไม่มีคำอธิบาย"}
                </p>

                <div className="flex items-center gap-4 text-sm text-gray-500 mt-auto">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <span>{template.template_section_links?.length || 0} sections</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
                    </svg>
                    <span>
                      {template.template_section_links?.reduce(
                        (sum, link) => sum + (link.templates_section?.section_blocks?.length || 0),
                        0
                      )}{" "}
                      blocks
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 bg-gray-50 border-t flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(`ใช้เทมเพลต: ${template.template_name}`);
                  }}
                  className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-500 transition"
                >
                  ใช้เทมเพลตนี้
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTemplate(template);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  ดูตัวอย่าง
                </button>
              </div>
            </div>
          ))}
        </div>

        {templates.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📄</div>
            <p className="text-xl text-gray-600 mb-2">ยังไม่มีเทมเพลต</p>
            <p className="text-gray-500">กดปุ่มด้านบนเพื่อสร้างเทมเพลตใหม่</p>
          </div>
        )}
      </div>

      {/* Modal - Template Detail */}
      {selectedTemplate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTemplate(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b flex items-start justify-between bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {selectedTemplate.template_name}
                </h2>
                <p className="text-gray-600">{selectedTemplate.description}</p>
                <div className="flex items-center gap-3 mt-3">
                  {selectedTemplate.category && (
                    <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {selectedTemplate.category}
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    Template ID: {selectedTemplate.ID}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none ml-4"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  {selectedTemplate.template_section_links?.length || 0}
                </span>
                Sections ในเทมเพลตนี้
              </h3>

              <div className="space-y-6">
                {selectedTemplate.template_section_links?.map((link) => {
                  const section = link.templates_section;
                  if (!section) return null;

                  return (
                    <div
                      key={link.ID}
                      className="border-2 border-gray-200 rounded-xl p-5 hover:border-blue-300 transition bg-white"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded">
                              Section {link.order_index + 1}
                            </span>
                            <h4 className="text-lg font-bold text-gray-900">
                              {section.section_name}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-500">
                            {section.section_blocks?.length || 0} blocks
                          </p>
                        </div>
                      </div>

                      {/* Section Container with Layout */}
                      <div className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
                        {/* ตรวจสอบว่าเป็น Profile Layout หรือไม่ */}
                        {section.section_blocks && section.section_blocks.length > 0 && 
                         section.section_blocks[0].templates_block?.block_name === 'profile_picture' ? (
                          // Layout พิเศษสำหรับ Profile: วงกลมซ้าย + textbox เรียงแนวตั้งขวา
                          <div className="flex gap-4 items-start">
                            {/* Profile Picture - ด้านซ้าย */}
                            {(() => {
                              const sb = section.section_blocks[0];
                              const block = sb.templates_block;
                              let flexSettings: any = {};
                              let defaultStyle: any = {};
                              
                              try {
                                flexSettings = sb.flex_settings ? 
                                  (typeof sb.flex_settings === 'string' ? JSON.parse(sb.flex_settings) : sb.flex_settings) 
                                  : {};
                                defaultStyle = block.default_style ? 
                                  (typeof block.default_style === 'string' ? JSON.parse(block.default_style) : block.default_style) 
                                  : {};
                              } catch (e) {}

                              const combinedStyle: React.CSSProperties = {
                                width: '200px',
                                height: '200px',
                                minHeight: '200px',
                                display: 'flex',
                                borderRadius: '50%',
                                backgroundColor: defaultStyle.background_color || '#ffffff',
                                border: defaultStyle.border || '2px dashed #d1d5db',
                                padding: defaultStyle.padding || '16px',
                                boxShadow: defaultStyle.box_shadow || '0 1px 3px rgba(0,0,0,0.1)',
                                position: 'relative',
                                flexShrink: 0,
                              };

                              return (
                                <div style={combinedStyle} className="hover:shadow-lg transition-all group">
                                  <div className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded shadow">1</span>
                                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded shadow">{block.block_type}</span>
                                  </div>
                                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <div className="text-2xl mb-2">🖼️</div>
                                    <div className="text-sm font-medium text-gray-700">{block.block_name}</div>
                                    <div className="text-xs text-gray-400 mt-1">{block.block_type}</div>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Text Boxes - ด้านขวาเรียงแนวตั้ง */}
                            <div className="flex-1 flex flex-col gap-4">
                              {section.section_blocks.slice(1).map((sb, idx) => {
                                const block = sb.templates_block;
                                if (!block) return null;

                                let flexSettings: any = {};
                                let defaultStyle: any = {};

                                try {
                                  flexSettings = sb.flex_settings ? 
                                    (typeof sb.flex_settings === 'string' ? JSON.parse(sb.flex_settings) : sb.flex_settings) 
                                    : {};
                                  defaultStyle = block.default_style ? 
                                    (typeof block.default_style === 'string' ? JSON.parse(block.default_style) : block.default_style) 
                                    : {};
                                } catch (e) {}

                                const combinedStyle: React.CSSProperties = {
                                  width: '100%',
                                  height: 'auto',
                                  minHeight: '60px',
                                  display: 'flex',
                                  borderRadius: flexSettings.borderRadius || defaultStyle.border_radius || '8px',
                                  backgroundColor: defaultStyle.background_color || '#ffffff',
                                  border: defaultStyle.border || '2px dashed #d1d5db',
                                  padding: defaultStyle.padding || '16px',
                                  boxShadow: defaultStyle.box_shadow || '0 1px 3px rgba(0,0,0,0.1)',
                                  position: 'relative',
                                };

                                return (
                                  <div key={sb.ID} style={combinedStyle} className="hover:shadow-lg transition-all group">
                                    <div className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded shadow">
                                        {idx + 2}
                                      </span>
                                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded shadow">{block.block_type}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                      <div className="text-2xl mb-2">📝</div>
                                      <div className="text-sm font-medium text-gray-700">{block.block_name}</div>
                                      <div className="text-xs text-gray-400 mt-1">{block.block_type}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                        // วางเป็นกริด 2x2 สำหรับ Portfolio Showcase
                        ) : section.section_name === 'Portfolio Showcase' ? (
                          // Layout Grid 2x2 สำหรับ Portfolio Showcase
                          <div className="grid grid-cols-2 gap-4">
                            {section.section_blocks?.map((sb, index) => {
                              const block = sb.templates_block;
                              if (!block) return null;

                              let flexSettings: any = {};
                              let defaultStyle: any = {};

                              try {
                                flexSettings = sb.flex_settings ? 
                                  (typeof sb.flex_settings === 'string' ? JSON.parse(sb.flex_settings) : sb.flex_settings) 
                                  : {};
                                defaultStyle = block.default_style ? 
                                  (typeof block.default_style === 'string' ? JSON.parse(block.default_style) : block.default_style) 
                                  : {};
                              } catch (e) {}

                              const combinedStyle: React.CSSProperties = {
                                width: '100%',
                                height: 'auto',
                                minHeight: block.block_type === 'image' ? '200px' : '100px',
                                display: 'flex',
                                borderRadius: flexSettings.borderRadius || defaultStyle.border_radius || '8px',
                                backgroundColor: defaultStyle.background_color || '#ffffff',
                                border: defaultStyle.border || '2px dashed #d1d5db',
                                padding: defaultStyle.padding || '16px',
                                boxShadow: defaultStyle.box_shadow || '0 1px 3px rgba(0,0,0,0.1)',
                                position: 'relative',
                              };

                              return (
                                <div key={sb.ID} style={combinedStyle} className="hover:shadow-lg transition-all group">
                                  <div className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded shadow">
                                      {sb.order_index + 1}
                                    </span>
                                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded shadow">{block.block_type}</span>
                                  </div>
                                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <div className="text-2xl mb-2">
                                      {block.block_type === 'image' ? '🖼️' : '📝'}
                                    </div>
                                    <div className="text-sm font-medium text-gray-700">{block.block_name}</div>
                                    <div className="text-xs text-gray-400 mt-1">{block.block_type}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div> ): (
                          // Layout ปกติ: เรียงข้างๆกันในแนวนอน
                          <div className="flex flex-wrap gap-4 items-start">
                            {section.section_blocks?.map((sb, index) => {
                              const block = sb.templates_block;
                              if (!block) return null;

                              let flexSettings: any = {};
                              let position: any = {};
                              let defaultStyle: any = {};

                              try {
                                flexSettings = sb.flex_settings ? 
                                  (typeof sb.flex_settings === 'string' ? JSON.parse(sb.flex_settings) : sb.flex_settings) 
                                  : {};
                                position = sb.position ? 
                                  (typeof sb.position === 'string' ? JSON.parse(sb.position) : sb.position) 
                                  : {};
                                defaultStyle = block.default_style ? 
                                  (typeof block.default_style === 'string' ? JSON.parse(block.default_style) : block.default_style) 
                                  : {};
                              } catch (e) {
                                console.error('Error parsing JSON:', e);
                              }

                              const combinedStyle: React.CSSProperties = {
                                width: flexSettings.width || defaultStyle.width || 'auto',
                                height: flexSettings.height || defaultStyle.height || 'auto',
                                minHeight: block.block_type === 'image' ? '120px' : '60px',
                                minWidth: block.block_type === 'image' ? '120px' : '150px',
                                display: 'flex',
                                borderRadius: flexSettings.borderRadius || defaultStyle.border_radius || '8px',
                                flex: flexSettings.flex || '1',
                                backgroundColor: defaultStyle.background_color || '#ffffff',
                                border: defaultStyle.border || '2px dashed #d1d5db',
                                padding: defaultStyle.padding || '16px',
                                boxShadow: defaultStyle.box_shadow || '0 1px 3px rgba(0,0,0,0.1)',
                                position: 'relative',
                              };

                              return (
                                <div key={sb.ID} style={combinedStyle} className="hover:shadow-lg transition-all group">
                                  <div className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded shadow">
                                      {sb.order_index + 1}
                                    </span>
                                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded shadow">{block.block_type}</span>
                                  </div>
                                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <div className="text-2xl mb-2">
                                      {block.block_type === 'image' ? '🖼️' : '📝'}
                                    </div>
                                    <div className="text-sm font-medium text-gray-700">{block.block_name}</div>
                                    <div className="text-xs text-gray-400 mt-1">{block.block_type}</div>
                                  </div>
                                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {Object.keys(flexSettings).length > 0 && (
                                      <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">
                                        Layout: {sb.layout_type || 'flex'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Section Details (Expandable) */}
                      
                    </div>
                  );
                })}

                {(!selectedTemplate.template_section_links ||
                  selectedTemplate.template_section_links.length === 0) && (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-5xl mb-3">📋</div>
                    <p className="text-lg">เทมเพลตนี้ยังไม่มี sections</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition"
              >
                ปิด
              </button>
              <button
                onClick={() => {
                  alert(`ใช้เทมเพลต: ${selectedTemplate.template_name}`);
                  setSelectedTemplate(null);
                }}
                className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
              >
                ใช้เทมเพลตนี้
              </button>
              <button className="px-6 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition">
                แก้ไขเทมเพลต
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}