"use client";

import { useEffect, useState } from "react";
import { Template } from "@/src/interfaces/template";
import { fetchTemplates } from "@/services/templates";
import { fetchMyPortfolios, useTemplate, createTemplate } from "@/services/portfolio";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [myPortfolios, setMyPortfolios] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");

  const router = useRouter();

  const handleUseTemplate = async (template: Template) => {
    try {
      // ✅ Check if we already have a portfolio for this template (Active or Inactive)
      const existingPortfolio = myPortfolios.find(p => {
        const templateId = p.template_id || p.TemplateID;
        return templateId === template.ID;
      });

      console.log("🔍 Checking template:", template.ID);
      console.log("📦 My portfolios:", myPortfolios.map(p => ({
        id: p.ID,
        template_id: p.template_id || p.TemplateID
      })));
      console.log("✅ Existing portfolio:", existingPortfolio);

      // If it exists but is ACTIVE, just go to sections.
      // If it exists but INACTIVE, we still call useTemplate to reactivate it on backend.
      if (existingPortfolio && existingPortfolio.status === 'active') {
        // Direct to sections with specific portfolio_id
        router.push(`/admin/template/section?portfolio_id=${existingPortfolio.ID}`);
        return;
      }

      // Create new portfolio from template
      const res = await useTemplate(template.ID);
      const newPortfolio = res.data;

      if (newPortfolio && newPortfolio.ID) {
        alert("นำเทมเพลตไปใช้งานแล้ว! Sections ถูกเพิ่มเรียบร้อยแล้ว");

        // ✅ อัปเดต state เพื่อให้ปุ่มเปลี่ยนทันที
        await loadAll();

        // Direct to sections page
        router.push(`/admin/template/section?portfolio_id=${newPortfolio.ID}`);
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการใช้เทมเพลต");
      console.error(err);
    }
  };

  const handleCreatePortfolio = async () => {
    try {
      if (!newPortfolioName) {
        alert("กรุณากรอกชื่อ Portfolio");
        return;
      }

      const res = await createTemplate({ template_name: newPortfolioName });
      alert("สร้าง Template สำเร็จ");
      setIsCreateModalOpen(false);
      setNewPortfolioName("");

      // Reload list
      loadAll();
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการสร้าง Template");
    }
  };

  const loadAll = async () => {
    try {
      const [tplData, portData] = await Promise.all([
        fetchTemplates(),
        fetchMyPortfolios()
      ]);

      const sortedData = tplData.map((template: Template) => ({
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
      setMyPortfolios(portData.data || []);

      // 🐛 Debug: ดูข้อมูลที่โหลดมา
      console.log("📊 Templates loaded:", sortedData.length);
      console.log("📦 Portfolios loaded:", portData.data?.length || 0);
      console.log("🔗 Portfolio-Template mapping:", portData.data?.map((p: any) => ({
        portfolio_id: p.ID,
        template_id: p.template_id || p.TemplateID,
        name: p.portfolio_name
      })));

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
    <div className="min-h-screen bg-gray-50 relative">
      {/* Sticky Navbar */}
      <div className="sticky top-0 bg-white shadow-md z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="hidden md:flex items-center gap-6">
              <Link href="/admin/template" className="text-blue-600 font-medium hover:text-blue-700 transition border-b-2 border-blue-600 pb-1">
                Templates
              </Link>
              <Link href="/admin/template/section" className="text-gray-600 hover:text-gray-900 transition pb-1">
                Sections
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <button className="text-gray-600 hover:text-gray-900 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
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
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition shadow-md hover:shadow-lg">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              สร้าง Portfolio ใหม่
            </span>
          </button>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => {
            // ✅ 1. Check for ANY portfolio (Active or Inactive) to show saved data
            const userPortfolio = myPortfolios.find(p => {
              const templateId = p.template_id || p.TemplateID;
              return templateId === template.ID;
            });

            // ✅ 2. Check if it is validly ACTIVE (for Button UI)
            const isActivePortfolio = userPortfolio && userPortfolio.status === 'active';

            // 🐛 Debug: แสดงสถานะของแต่ละการ์ด
            console.log(`Template ${template.ID} (${template.template_name}):`, {
              has_portfolio: !!userPortfolio,
              is_active: isActivePortfolio,
              portfolio_id: userPortfolio?.ID
            });

            // Determine sections to show (Always show user sections if they exist, even if inactive)
            let displaySections: any[] = [];
            if (userPortfolio && userPortfolio.portfolio_sections) {
              displaySections = userPortfolio.portfolio_sections
                .filter((s: any) => s.is_enabled)
                .map((s: any) => ({ id: s.ID, name: s.section_title, order: s.section_order }));
            } else if (template.template_section_links) {
              displaySections = template.template_section_links.map(l => ({
                id: l.ID,
                name: l.templates_section?.section_name,
                order: l.order_index
              }));
            }
            displaySections.sort((a, b) => a.order - b.order);

            return (
              <div
                key={template.ID}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden group relative"
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
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

                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{template.template_name}</h3>
                    {template.category && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                        {template.category}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {template.description || "ไม่มีคำอธิบาย"}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      <span>{displaySections.length} sections</span>
                    </div>
                    {isActivePortfolio && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full text-green-600 bg-green-100">
                        ✓ ใช้งานแล้ว
                      </span>
                    )}
                  </div>
                </div>

                {/* ✅ ปุ่มเดียว: ใช้เทมเพลตนี้ หรือ จัดการ Sections */}
                <div className="px-5 py-3 bg-gray-50 border-t flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUseTemplate(template);
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${isActivePortfolio
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                  >
                    {isActivePortfolio ? "จัดการ Sections" : "ใช้เทมเพลตนี้"}
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
            );
          })}
        </div>

        {templates.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📄</div>
            <p className="text-xl text-gray-600 mb-2">ยังไม่มีเทมเพลต</p>
            <p className="text-gray-500">กดปุ่มด้านบนเพื่อสร้างเทมเพลตใหม่</p>
          </div>
        )}
      </div>

      {/* Modal - Create Portfolio */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">สร้าง Portfolio ใหม่</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ Portfolio <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="เช่น My Awesome Portfolio"
                  value={newPortfolioName}
                  onChange={e => setNewPortfolioName(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreatePortfolio}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition"
              >
                สร้าง
              </button>
            </div>
          </div>
        </div>
      )}

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
                {(() => {
                  const userPortfolio = myPortfolios.find(p => {
                    const templateId = p.template_id || p.TemplateID;
                    return templateId === selectedTemplate.ID;
                  });
                  let sectionsToRender: any[] = [];

                  if (userPortfolio && userPortfolio.portfolio_sections && userPortfolio.portfolio_sections.length > 0) {
                    const enabledSections = userPortfolio.portfolio_sections.filter((ps: any) => ps.is_enabled !== false);
                    sectionsToRender = enabledSections.map((ps: any) => ({
                      ID: ps.ID,
                      order_index: ps.section_order,
                      templates_section: {
                        section_name: ps.section_title,
                        section_blocks: ps.portfolio_blocks?.map((pb: any) => ({
                          ID: pb.ID,
                          flex_settings: pb.flex_settings,
                          position: pb.position,
                          templates_block: pb.templates_block
                        })) || []
                      }
                    }));
                  } else {
                    sectionsToRender = selectedTemplate.template_section_links || [];
                  }

                  if (sectionsToRender.length === 0) {
                    return (
                      <div className="text-center py-12 text-gray-400">
                        <div className="text-5xl mb-3">📋</div>
                        <p className="text-lg">เทมเพลตนี้ยังไม่มี sections</p>
                      </div>
                    );
                  }

                  return sectionsToRender.map((link) => {
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

                        <div className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
                          {section.section_blocks && section.section_blocks.length > 0 &&
                            section.section_blocks[0].templates_block?.block_name === 'profile_picture' ? (
                            <div className="flex gap-4 items-start">
                              {(() => {
                                const sb = section.section_blocks[0];
                                const block = sb.templates_block;
                                return (
                                  <div className="w-[200px] h-[200px] rounded-full bg-white border-2 border-dashed border-gray-300 flex items-center justify-center">
                                    <div className="text-center text-gray-500">
                                      <div className="text-2xl mb-2">🖼️</div>
                                      <div className="text-sm font-medium">{block.block_name}</div>
                                    </div>
                                  </div>
                                );
                              })()}
                              <div className="flex-1 flex flex-col gap-4">
                                {section.section_blocks.slice(1).map((sb: any, idx: any) => {
                                  const block = sb.templates_block;
                                  if (!block) return null;
                                  return (
                                    <div key={sb.ID} className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[60px] flex items-center justify-center">
                                      <div className="text-center text-gray-500">
                                        <div className="text-sm font-medium">{block.block_name}</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : section.section_name === 'Portfolio Showcase' ? (
                            <div className="grid grid-cols-2 gap-4">
                              {section.section_blocks?.map((sb: any) => {
                                const block = sb.templates_block;
                                if (!block) return null;
                                return (
                                  <div key={sb.ID} className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[150px] flex items-center justify-center">
                                    <div className="text-center text-gray-500">
                                      <div className="text-2xl mb-2">{block.block_type === 'image' ? '🖼️' : '📝'}</div>
                                      <div className="text-sm font-medium">{block.block_name}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-4 items-start">
                              {section.section_blocks?.map((sb: any) => {
                                const block = sb.templates_block;
                                if (!block) return null;
                                return (
                                  <div key={sb.ID} className="flex-1 min-w-[150px] bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[100px] flex items-center justify-center">
                                    <div className="text-center text-gray-500">
                                      <div className="text-2xl mb-2">{block.block_type === 'image' ? '🖼️' : '📝'}</div>
                                      <div className="text-sm font-medium">{block.block_name}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
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
                  handleUseTemplate(selectedTemplate);
                }}
                className={`px-6 py-2.5 rounded-lg font-medium transition ${myPortfolios.find(p => {
                  const templateId = p.template_id || p.TemplateID;
                  return templateId === selectedTemplate.ID && p.status === 'active';
                })
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                {myPortfolios.find(p => {
                  const templateId = p.template_id || p.TemplateID;
                  return templateId === selectedTemplate.ID && p.status === 'active';
                }) ? "จัดการ Sections" : "ใช้เทมเพลตนี้"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}