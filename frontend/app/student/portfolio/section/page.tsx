"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// Use actual API
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function fetchMyPortfolios() {
    const response = await fetch(`${API}/portfolio/my`);
    if (!response.ok) throw new Error("Failed to fetch portfolios");
    return response.json();
}

async function fetchActivities() {
    const response = await fetch(`${API}/portfolio/activities`);
    if (!response.ok) throw new Error("Failed to fetch activities");
    return response.json();
}

async function fetchWorkings() {
    const response = await fetch(`${API}/portfolio/workings`);
    if (!response.ok) throw new Error("Failed to fetch workings");
    return response.json();
}

async function createSection(data: any) {
    const response = await fetch(`${API}/portfolio/section`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create section");
    return response.json();
}

async function updateSection(sectionId: number, data: any) {
    const response = await fetch(`${API}/portfolio/section/${sectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update section");
    return response.json();
}

async function createBlock(data: any) {
    const response = await fetch(`${API}/portfolio/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create block");
    return response.json();
}

async function updateBlock(blockId: number, data: any) {
    const response = await fetch(`${API}/portfolio/block/${blockId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update block");
    return response.json();
}

async function deleteBlock(blockId: number) {
    const response = await fetch(`${API}/portfolio/block/${blockId}`, {
        method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete block");
    return response.json();
}

interface PortfolioSection {
    ID: number;
    section_title: string;
    section_port_key: string;
    section_blocks: any[];
    portfolio_id: number;
    order_index: number;
    is_enabled: boolean;
}

function SectionsContent() {
    const [sections, setSections] = useState<PortfolioSection[]>([]);
    const [selectedSection, setSelectedSection] = useState<PortfolioSection | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPortfolioID, setCurrentPortfolioID] = useState<number | null>(null);
    const [currentTemplateID, setCurrentTemplateID] = useState<number | null>(null);

    const [activities, setActivities] = useState<any[]>([]);
    const [workings, setWorkings] = useState<any[]>([]);

    const [isEditingItem, setIsEditingItem] = useState(false);
    const [selectedDataType, setSelectedDataType] = useState<'activity' | 'working'>('activity');
    const [selectedDataId, setSelectedDataId] = useState<string>("");
    const [currentBlock, setCurrentBlock] = useState<any>(null);

    const searchParams = useSearchParams();
    const portfolioIdParam = searchParams.get("portfolio_id");

    const loadAll = async () => {
        try {
            const [portfoliosComp, activitiesComp, workingsComp] = await Promise.all([
                fetchMyPortfolios(),
                fetchActivities(),
                fetchWorkings()
            ]);

            const portfolios = portfoliosComp.data || [];

            console.log("Activities loaded:", activitiesComp.data);
            console.log("Workings loaded:", workingsComp.data);

            setActivities(activitiesComp.data || []);
            setWorkings(workingsComp.data || []);

            let targetPortfolioID: number | null = null;
            if (portfolioIdParam && !isNaN(Number(portfolioIdParam))) {
                targetPortfolioID = Number(portfolioIdParam);
            } else if (portfolios.length > 0) {
                targetPortfolioID = portfolios[0].ID;
            }

            setCurrentPortfolioID(targetPortfolioID);

            const targetPortfolio = portfolios.find((p: any) => p.ID === targetPortfolioID);

            if (!targetPortfolio) {
                console.warn("⚠️ Portfolio ID not found:", targetPortfolioID);
                setSections([]);
                setLoading(false);
                return;
            }

            if (targetPortfolio.template_id) {
                setCurrentTemplateID(targetPortfolio.template_id);
            }

            const allSections: PortfolioSection[] = [];
            if (targetPortfolio.portfolio_sections) {
                targetPortfolio.portfolio_sections.forEach((s: any) => {
                    console.log("Section blocks:", s.portfolio_blocks);
                    allSections.push({
                        ID: s.ID,
                        section_title: s.section_title || "Untitled Section",
                        section_port_key: s.section_port_key,
                        section_blocks: s.portfolio_blocks || [],
                        portfolio_id: targetPortfolio.ID,
                        order_index: s.section_order,
                        is_enabled: s.is_enabled !== undefined ? s.is_enabled : true,
                    });
                });
            }

            allSections.sort((a, b) => a.order_index - b.order_index);
            setSections(allSections);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching data:", err);
            setLoading(false);
        }
    };

    const handleCreateSection = async () => {
        if (!currentPortfolioID) {
            alert("ไม่พบ Portfolio กรุณาสร้าง Portfolio ก่อน (Use Template)");
            return;
        }
        const name = prompt("ชื่อ Section ใหม่:");
        if (!name) return;

        try {
            await createSection({
                section_title: name,
                section_port_key: name,
                portfolio_id: currentPortfolioID,
                section_order: sections.length + 1,
                is_enabled: true
            });
            alert("สร้าง Section สำเร็จ!");
            loadAll();
        } catch (e) {
            console.error(e);
            alert("เกิดข้อผิดพลาดในการสร้าง Section");
        }
    };

    const handleToggleSection = async (id: number, currentStatus: boolean) => {
        try {
            setSections(prev => prev.map(s => s.ID === id ? { ...s, is_enabled: !currentStatus } : s));
            await updateSection(id, { is_enabled: !currentStatus });
            alert(!currentStatus ? "เปิดใช้งาน Section แล้ว" : "ปิดการใช้งาน Section");
        } catch (err) {
            console.error("Failed to toggle section:", err);
            setSections(prev => prev.map(s => s.ID === id ? { ...s, is_enabled: currentStatus } : s));
            alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
        }
    };

    const handleSaveItem = async () => {
        if (!selectedSection || !selectedDataId) {
            alert("กรุณาเลือกข้อมูลก่อน");
            return;
        }

        try {
            let dataItem: any = null;
            let dataName = "";

            if (selectedDataType === 'activity') {
                dataItem = activities.find(a => a.ID.toString() === selectedDataId);
                dataName = dataItem?.activity_name || "";
                console.log("Selected activity:", dataItem);
            } else {
                dataItem = workings.find(w => w.ID.toString() === selectedDataId);
                dataName = dataItem?.working_name || "";
                console.log("Selected working:", dataItem);
            }

            if (!dataItem) {
                alert("ไม่พบข้อมูลที่เลือก");
                return;
            }

            const contentData = {
                title: dataName,
                type: selectedDataType,
                data_id: parseInt(selectedDataId),
                data: dataItem
            };

            console.log("Saving content:", contentData);

            // ถ้ามี block อยู่แล้ว = แก้ไข, ถ้าไม่มี = สร้างใหม่
            if (currentBlock) {
                await updateBlock(currentBlock.ID, {
                    content: contentData
                });
                alert("แก้ไขข้อมูลสำเร็จ!");
            } else {
                await createBlock({
                    portfolio_section_id: selectedSection.ID,
                    block_order: 1,
                    content: contentData
                });
                alert("เพิ่มข้อมูลสำเร็จ!");
            }

            setIsEditingItem(false);
            setSelectedDataId("");
            setCurrentBlock(null);
            await loadAll();

            // Refresh selected section
            const updatedSections = await fetchMyPortfolios();
            const portfolio = updatedSections.data.find((p: any) => p.ID === currentPortfolioID);
            const updatedSection = portfolio?.portfolio_sections.find((s: any) => s.ID === selectedSection.ID);
            if (updatedSection) {
                setSelectedSection({
                    ID: updatedSection.ID,
                    section_title: updatedSection.section_title,
                    section_port_key: updatedSection.section_port_key,
                    section_blocks: updatedSection.portfolio_blocks || [],
                    portfolio_id: portfolio.ID,
                    order_index: updatedSection.section_order,
                    is_enabled: updatedSection.is_enabled,
                });
            }
        } catch (err) {
            console.error("Save error:", err);
            alert("เกิดข้อผิดพลาดในการบันทึก");
        }
    };

    const handleDeleteBlock = async (blockId: number) => {
        if (!confirm("ต้องการลบข้อมูลนี้?")) return;

        try {
            await deleteBlock(blockId);
            alert("ลบข้อมูลสำเร็จ!");
            await loadAll();

            if (selectedSection) {
                const updatedSections = await fetchMyPortfolios();
                const portfolio = updatedSections.data.find((p: any) => p.ID === currentPortfolioID);
                const updatedSection = portfolio?.portfolio_sections.find((s: any) => s.ID === selectedSection.ID);
                if (updatedSection) {
                    setSelectedSection({
                        ID: updatedSection.ID,
                        section_title: updatedSection.section_title,
                        section_port_key: updatedSection.section_port_key,
                        section_blocks: updatedSection.portfolio_blocks || [],
                        portfolio_id: portfolio.ID,
                        order_index: updatedSection.section_order,
                        is_enabled: updatedSection.is_enabled,
                    });
                }
            }
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาดในการลบ");
        }
    };

    const handleEditBlock = (block: any) => {
        console.log("Editing block:", block);
        const content = typeof block.content === 'string' ? JSON.parse(block.content) : block.content;
        console.log("Block content:", content);

        setCurrentBlock(block);
        setSelectedDataType(content.type || 'activity');
        setSelectedDataId(content.data_id?.toString() || "");
        setIsEditingItem(true);
    };

    const getBlockData = (section: PortfolioSection) => {
        if (!section.section_blocks || section.section_blocks.length === 0) return null;
        const block = section.section_blocks[0];

        // Parse content if it's a string
        let content = block.content;
        if (typeof content === 'string') {
            try {
                content = JSON.parse(content);
            } catch (e) {
                console.error("Failed to parse block content:", e);
                return null;
            }
        }

        const data = content?.data || {};
        console.log("Block data for section", section.ID, ":", { block, content, data });

        return { block, content, data };
    };

    const getImages = (blockData: any) => {
        if (!blockData) return [];
        const { content, data } = blockData;

        let images = [];
        if (content?.type === 'activity') {
            // ลำดับความสำคัญ: ActivityDetail (Preload) > activity_detail (JSON)
            images = data?.ActivityDetail?.Images ||
                data?.ActivityDetail?.images ||
                data?.activity_detail?.Images ||
                data?.activity_detail?.images ||
                [];
        } else {
            // ลำดับความสำคัญ: WorkingDetail (Preload) > working_detail (JSON)
            images = data?.WorkingDetail?.Images ||
                data?.WorkingDetail?.images ||
                data?.working_detail?.Images ||
                data?.working_detail?.images ||
                [];
        }

        console.log("Images for block (type: " + content?.type + "):", images);
        return images;
    };

    useEffect(() => {
        loadAll();
    }, [portfolioIdParam]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg text-gray-600">กำลังโหลด...</div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-gray-50">
                {/* Header - Original Design */}
                <div className="sticky top-0 bg-white shadow-md z-40">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center gap-8">
                                <div className="hidden md:flex items-center gap-6">
                                    <Link href="/student/portfolio" className="text-gray-600 hover:text-gray-900 transition pb-1">
                                        Portfolios
                                    </Link>
                                    <Link href="/student/portfolio/section" className="text-blue-600 font-medium hover:text-blue-700 transition border-b-2 border-blue-600 pb-1">
                                        Sections
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto p-6">
                    {/* Page Header - Original Design */}
                    <div className="flex items-center justify-between mb-8 mt-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Portfolio Sections</h1>
                            <p className="text-gray-600 mt-2">
                                จัดการ Sections {currentPortfolioID ? `(Portfolio ID: ${currentPortfolioID}` : ""}
                                {currentTemplateID ? `, Template ID: ${currentTemplateID})` : ")"}
                            </p>
                            <p className="text-sm text-amber-600 mt-1">
                                💡 เปิด/ปิด Sections เพื่อควบคุมการแสดงผล • คลิกการ์ดเพื่อจัดการข้อมูล
                            </p>
                        </div>
                        <button
                            onClick={handleCreateSection}
                            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition shadow-md hover:shadow-lg"
                        >
                            <span className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                เพิ่ม Section
                            </span>
                        </button>
                    </div>

                    {/* Sections Grid - Original Design */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sections.map((section) => {
                            const blockData = getBlockData(section);
                            const images = getImages(blockData);
                            const hasData = blockData !== null;

                            return (
                                <div
                                    key={section.ID}
                                    className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border-2 ${section.is_enabled ? 'border-green-200' : 'border-gray-200 opacity-60'
                                        }`}
                                >
                                    {/* Toggle Switch */}
                                    <div
                                        className="absolute top-3 right-3 z-30 flex items-center gap-2 bg-white bg-opacity-95 rounded-full px-3 py-1.5 shadow-md cursor-pointer hover:shadow-lg transition-all"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleSection(section.ID, section.is_enabled);
                                        }}
                                    >
                                        <span className={`text-xs font-bold ${section.is_enabled ? 'text-green-600' : 'text-gray-400'}`}>
                                            {section.is_enabled ? 'เปิด' : 'ปิด'}
                                        </span>
                                        <div className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${section.is_enabled ? 'bg-green-500' : 'bg-gray-300'
                                            }`}>
                                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${section.is_enabled ? 'translate-x-5' : ''
                                                }`}></div>
                                        </div>
                                    </div>

                                    {/* Card Preview */}
                                    <div
                                        className={`min-h-[200px] bg-gradient-to-br from-purple-500 to-pink-600 relative overflow-hidden p-4 cursor-pointer ${!section.is_enabled && 'grayscale'
                                            }`}
                                        onClick={() => setSelectedSection(section)}
                                    >
                                        <div className="text-white h-full">
                                            <div className="text-xs font-semibold mb-2 opacity-80">PREVIEW</div>
                                            <div className="space-y-2">
                                                {hasData && blockData ? (
                                                    <>
                                                        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded px-3 py-2 text-xs flex gap-2 items-center">
                                                            <span>{blockData.content?.type === 'activity' ? '🏆' : '💼'}</span>
                                                            <span className="truncate flex-1">{blockData.content?.title || 'Untitled'}</span>
                                                        </div>
                                                        {images.length > 0 && (
                                                            <div className="grid grid-cols-2 gap-1">
                                                                {images.slice(0, 2).map((img: any, idx: number) => (
                                                                    <div key={idx} className="aspect-square rounded overflow-hidden bg-white bg-opacity-20">
                                                                        <img
                                                                            src={img.file_path || img.FilePath || img.image_url || img.ImageUrl || '/placeholder.jpg'}
                                                                            alt={`Preview ${idx + 1}`}
                                                                            className="w-full h-full object-cover"
                                                                            onError={(e) => {
                                                                                e.currentTarget.src = '/placeholder.jpg';
                                                                            }}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="text-xs opacity-60">ยังไม่มีข้อมูล - คลิกเพื่อเพิ่ม</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="p-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-lg font-bold text-gray-900 truncate">{section.section_title}</h3>
                                            {section.is_enabled && (
                                                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                                                    ✓ Visible
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-3">
                                            <span>ID: {section.ID}</span>
                                            <span>•</span>
                                            <span>{hasData ? '1 รายการ' : '0 รายการ'}</span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="px-5 py-3 bg-gray-50 border-t">
                                        <button
                                            onClick={() => setSelectedSection(section)}
                                            className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
                                        >
                                            📝 จัดการข้อมูล
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {sections.length === 0 && (
                        <div className="text-center py-16">
                            <div className="text-gray-400 text-6xl mb-4">📋</div>
                            <p className="text-xl text-gray-600 mb-2">ยังไม่มี Sections ใน Portfolio นี้</p>
                            <p className="text-gray-500">กดปุ่ม "เพิ่ม Section" ด้านบนเพื่อเริ่มต้น</p>
                        </div>
                    )}
                </div>

                {/* Modal for Section Management */}
                {selectedSection && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => {
                            setSelectedSection(null);
                            setIsEditingItem(false);
                            setSelectedDataId("");
                            setCurrentBlock(null);
                        }}
                    >
                        <div
                            className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-6 border-b flex items-start justify-between bg-gradient-to-r from-purple-50 to-pink-50">
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        {selectedSection.section_title}
                                    </h2>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-500">
                                            Section ID: {selectedSection.ID} • Portfolio ID: {selectedSection.portfolio_id}
                                        </span>
                                        {selectedSection.is_enabled && (
                                            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                                                ✓ เปิดใช้งาน
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedSection(null);
                                        setIsEditingItem(false);
                                        setSelectedDataId("");
                                        setCurrentBlock(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 text-3xl leading-none ml-4"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {isEditingItem ? (
                                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                                        <h3 className="text-sm font-bold text-blue-900 mb-3">
                                            {currentBlock ? '✏️ แก้ไขข้อมูล' : '➕ เพิ่มข้อมูลใหม่'}
                                        </h3>

                                        <div className="space-y-3">
                                            {/* Select Type */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">ประเภทข้อมูล:</label>
                                                <select
                                                    className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={selectedDataType}
                                                    onChange={(e) => {
                                                        setSelectedDataType(e.target.value as 'activity' | 'working');
                                                        setSelectedDataId("");
                                                    }}
                                                >
                                                    <option value="activity">🏆 กิจกรรม (Activity)</option>
                                                    <option value="working">💼 ผลงาน (Working)</option>
                                                </select>
                                            </div>

                                            {/* Select Item */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    เลือก{selectedDataType === 'activity' ? 'กิจกรรม' : 'ผลงาน'}:
                                                </label>
                                                <select
                                                    className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={selectedDataId}
                                                    onChange={(e) => setSelectedDataId(e.target.value)}
                                                >
                                                    <option value="">-- เลือกรายการ --</option>
                                                    {selectedDataType === 'activity' && activities.map(act => (
                                                        <option key={act.ID} value={act.ID}>
                                                            {act.activity_name} {act.activity_role && `(${act.activity_role})`}
                                                        </option>
                                                    ))}
                                                    {selectedDataType === 'working' && workings.map(work => (
                                                        <option key={work.ID} value={work.ID}>
                                                            {work.working_name} {work.position && `(${work.position})`}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleSaveItem}
                                                    disabled={!selectedDataId}
                                                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                                                >
                                                    ✓ {currentBlock ? 'บันทึกการแก้ไข' : 'เพิ่มเข้า Section'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsEditingItem(false);
                                                        setSelectedDataId("");
                                                        setCurrentBlock(null);
                                                    }}
                                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                                                >
                                                    ✕ ยกเลิก
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {(() => {
                                            const blockData = getBlockData(selectedSection);

                                            if (!blockData) {
                                                return (
                                                    <div className="text-center py-12">
                                                        <div className="text-5xl mb-3">📦</div>
                                                        <p className="text-gray-600 mb-4">ยังไม่มีข้อมูลใน Section นี้</p>
                                                        <button
                                                            onClick={() => {
                                                                setIsEditingItem(true);
                                                                setCurrentBlock(null);
                                                            }}
                                                            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                                                        >
                                                            ➕ เพิ่มข้อมูล
                                                        </button>
                                                    </div>
                                                );
                                            }

                                            const { block, content, data } = blockData;
                                            const images = getImages(blockData);

                                            console.log("Rendering modal with data:", { content, data, images });

                                            return (
                                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-5">
                                                    <div className="mb-4">
                                                        <div className="inline-block bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-2">
                                                            {content?.type === 'activity' ? '🏆 กิจกรรม' : '💼 ผลงาน'}
                                                        </div>
                                                        <h4 className="font-bold text-gray-900 text-lg">{content?.title || 'Untitled'}</h4>
                                                    </div>

                                                    {/* รูปภาพ */}
                                                    {images && images.length > 0 && (
                                                        <div className="mb-4">
                                                            <div className="text-xs font-bold text-gray-700 mb-2">🖼️ รูปภาพ ({images.length} รูป)</div>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {images.map((img: any, imgIdx: number) => (
                                                                    <div key={imgIdx} className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                                                                        <img
                                                                            src={img.file_path || img.FilePath || img.image_url || img.ImageUrl || '/placeholder.jpg'}
                                                                            alt={`Image ${imgIdx + 1}`}
                                                                            className="w-full h-full object-cover hover:scale-110 transition-transform"
                                                                            onError={(e) => {
                                                                                e.currentTarget.src = '/placeholder.jpg';
                                                                            }}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* รายละเอียด */}
                                                    {content?.data && (
                                                        <div className="bg-white bg-opacity-70 rounded-lg p-3 mb-3 text-sm">
                                                            {content.type === 'activity' && (
                                                                <div className="space-y-1">
                                                                    {data.activity_role && (
                                                                        <div><strong>บทบาท:</strong> {data.activity_role}</div>
                                                                    )}
                                                                    {(data.ActivityDetail?.Institution || data.activity_detail?.institution) && (
                                                                        <div><strong>สถาบัน:</strong> {data.ActivityDetail?.Institution || data.activity_detail?.institution}</div>
                                                                    )}
                                                                    {(data.ActivityDetail?.Description || data.activity_detail?.description) && (
                                                                        <div className="text-gray-600"><strong>รายละเอียด:</strong> {data.ActivityDetail?.Description || data.activity_detail?.description}</div>
                                                                    )}
                                                                    {(data.ActivityDetail?.ActivityAt || data.activity_detail?.activity_at) && (
                                                                        <div><strong>วันที่:</strong> {new Date(data.ActivityDetail?.ActivityAt || data.activity_detail?.activity_at).toLocaleDateString('th-TH')}</div>
                                                                    )}
                                                                    {(data.ActivityDetail?.TypeActivity?.TypeName || data.activity_detail?.type_activity?.type_name) && (
                                                                        <div><strong>ประเภท:</strong> {data.ActivityDetail?.TypeActivity?.TypeName || data.activity_detail?.type_activity?.type_name}</div>
                                                                    )}
                                                                    {(data.ActivityDetail?.LevelActivity?.LevelName || data.activity_detail?.level_activity?.level_name) && (
                                                                        <div><strong>ระดับ:</strong> {data.ActivityDetail?.LevelActivity?.LevelName || data.activity_detail?.level_activity?.level_name}</div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {content.type === 'working' && (
                                                                <div className="space-y-1">
                                                                    {data.position && (
                                                                        <div><strong>ตำแหน่ง:</strong> {data.position}</div>
                                                                    )}
                                                                    {(data.WorkingDetail?.CompanyName || data.working_detail?.company_name) && (
                                                                        <div><strong>บริษัท:</strong> {data.WorkingDetail?.CompanyName || data.working_detail?.company_name}</div>
                                                                    )}
                                                                    {(data.WorkingDetail?.Description || data.working_detail?.description) && (
                                                                        <div className="text-gray-600"><strong>รายละเอียด:</strong> {data.WorkingDetail?.Description || data.working_detail?.description}</div>
                                                                    )}
                                                                    {(data.WorkingDetail?.StartDate || data.working_detail?.start_date) && (
                                                                        <div><strong>ระยะเวลา:</strong> {new Date(data.WorkingDetail?.StartDate || data.working_detail?.start_date).toLocaleDateString('th-TH')}
                                                                            {(data.WorkingDetail?.EndDate || data.working_detail?.end_date) && ` - ${new Date(data.WorkingDetail?.EndDate || data.working_detail?.end_date).toLocaleDateString('th-TH')}`}
                                                                        </div>
                                                                    )}
                                                                    {(data.WorkingDetail?.TypeWorking?.TypeName || data.working_detail?.type_working?.type_name) && (
                                                                        <div><strong>ประเภทงาน:</strong> {data.WorkingDetail?.TypeWorking?.TypeName || data.working_detail?.type_working?.type_name}</div>
                                                                    )}
                                                                    {(data.WorkingDetail?.Links || data.working_detail?.links) && (data.WorkingDetail?.Links?.length > 0 || data.working_detail?.links?.length > 0) && (
                                                                        <div>
                                                                            <strong>ลิงก์:</strong>
                                                                            <div className="pl-3">
                                                                                {(data.WorkingDetail?.Links || data.working_detail?.links).map((link: any, idx: number) => (
                                                                                    <div key={idx}>
                                                                                        <a href={link.Url || link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                                                            {link.LinkName || link.link_name || link.Url || link.url}
                                                                                        </a>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* ปุ่มจัดการ */}
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEditBlock(block)}
                                                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                                                        >
                                                            ✏️ แก้ไข
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteBlock(block.ID)}
                                                            className="text-red-500 hover:text-red-700 text-sm font-medium px-4 py-2 rounded hover:bg-red-50 transition"
                                                        >
                                                            🗑️ ลบ
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t bg-gray-50 flex justify-end">
                                <button
                                    onClick={() => {
                                        setSelectedSection(null);
                                        setIsEditingItem(false);
                                        setSelectedDataId("");
                                        setCurrentBlock(null);
                                    }}
                                    className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition"
                                >
                                    ปิด
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default function SectionsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div>Loading...</div></div>}>
            <SectionsContent />
        </Suspense>
    );
}
