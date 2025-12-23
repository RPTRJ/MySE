"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Color Theme
const theme = {
    primary: '#FF6B35',
    primaryLight: '#FFE5DC',
    primaryDark: '#E85A2A',
    secondary: '#FFA500',
    accent: '#FF8C5A',
};

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

async function deleteSection(sectionId: number) {
    const response = await fetch(`${API}/portfolio/section/${sectionId}`, {
        method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete section");
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

// Utility Functions
function parseBlockContent(content: any): any {
    if (!content) return null;
    if (typeof content === 'string') {
        try {
            return JSON.parse(content);
        } catch (e) {
            console.error('Failed to parse:', e);
            return null;
        }
    }
    return content;
}

function getImageUrl(image: any): string {
    return image?.file_path || image?.FilePath || image?.image_url || image?.ImageUrl || image?.working_image_url || '/placeholder.jpg';
}

function extractImages(data: any, type: 'activity' | 'working'): any[] {
    if (!data) return [];
    let images = [];
    if (type === 'activity') {
        images = data.ActivityDetail?.Images || data.activity_detail?.images || [];
    } else {
        images = data.WorkingDetail?.Images || data.working_detail?.images || [];
    }
    return Array.isArray(images) ? images : [];
}

function SectionsContent() {
    const [sections, setSections] = useState<PortfolioSection[]>([]);
    const [selectedSection, setSelectedSection] = useState<PortfolioSection | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPortfolioID, setCurrentPortfolioID] = useState<number | null>(null);
    const [currentPortfolioName, setCurrentPortfolioName] = useState<string>("");

    const [activities, setActivities] = useState<any[]>([]);
    const [workings, setWorkings] = useState<any[]>([]);

    const [isEditingItem, setIsEditingItem] = useState(false);
    const [selectedDataType, setSelectedDataType] = useState<'activity' | 'working'>('activity');
    const [selectedDataId, setSelectedDataId] = useState<string>("");
    const [currentBlock, setCurrentBlock] = useState<any>(null);
    const [imageIndices, setImageIndices] = useState<{ [key: number]: number }>({});

    const setSectionImageIndex = (sectionId: number, index: number) => {
        setImageIndices(prev => ({ ...prev, [sectionId]: index }));
    };

    // Auto-play timer
    useEffect(() => {
        const interval = setInterval(() => {
            setImageIndices(prev => {
                const newIndices = { ...prev };
                sections.forEach(section => {
                    const blocks = section.section_blocks || [];
                    if (blocks.length === 0) return;

                    const content = parseBlockContent(blocks[0].content);
                    const images = extractImages(content?.data, content?.type);

                    if (images.length > 1) {
                        const currentIndex = prev[section.ID] || 0;
                        newIndices[section.ID] = (currentIndex + 1) % images.length;
                    }
                });
                return newIndices;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [sections]);

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
                console.warn("⚠️ Portfolio not found:", targetPortfolioID);
                setSections([]);
                setLoading(false);
                return;
            }

            setCurrentPortfolioName(targetPortfolio.portfolio_name || targetPortfolio.PortfolioName || "");

            const allSections: PortfolioSection[] = [];
            if (targetPortfolio.portfolio_sections) {
                targetPortfolio.portfolio_sections.forEach((s: any) => {
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
            console.error("Error:", err);
            setLoading(false);
        }
    };

    const handleCreateSection = async () => {
        if (!currentPortfolioID) {
            alert("ไม่พบ Portfolio กรุณาสร้าง Portfolio ก่อน");
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
            alert("เกิดข้อผิดพลาด");
        }
    };

    const handleToggleSection = async (id: number, currentStatus: boolean) => {
        try {
            // ส่งไปยัง Backend
            await updateSection(id, { is_enabled: !currentStatus });

            // รอให้ DB อัปเดต
            await new Promise(resolve => setTimeout(resolve, 200));

            // โหลดข้อมูลใหม่
            await loadAll();

            alert(!currentStatus ? "เปิดใช้งาน Section แล้ว" : "ปิดการใช้งาน Section");
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาด");
        }
    };

    const handleDeleteSection = async (id: number) => {
        if (!confirm("คุณแน่ใจหรือไม่ที่จะลบ Section นี้? ข้อมูลทั้งหมดใน Section นี้จะหายไป")) return;

        try {
            await deleteSection(id);
            alert("ลบ Section สำเร็จ!");
            loadAll();
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาดในการลบ Section");
        }
    };
    useEffect(() => {
        // โหลดทุกครั้งที่หน้านี้ active
        const handleFocus = () => {
            console.log("🔄 Page focused - reloading sections");
            loadAll();
        };

        window.addEventListener('focus', handleFocus);
        loadAll(); // โหลดครั้งแรก

        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [portfolioIdParam]);

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
            } else {
                dataItem = workings.find(w => w.ID.toString() === selectedDataId);
                dataName = dataItem?.working_name || "";
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

            if (currentBlock) {
                await updateBlock(currentBlock.ID, { content: contentData });
                alert("แก้ไขข้อมูลสำเร็จ!");
            } else {
                // สร้าง block ใหม่โดยคำนวณ order
                const maxOrder = Math.max(0, ...selectedSection.section_blocks.map((b: any) => b.block_order || 0));
                await createBlock({
                    portfolio_section_id: selectedSection.ID,
                    block_order: maxOrder + 1,
                    content: contentData
                });
                alert("เพิ่มข้อมูลสำเร็จ!");
            }

            setIsEditingItem(false);
            setSelectedDataId("");
            setCurrentBlock(null);
            await loadAll();
            await refreshSelectedSection();
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาด");
        }
    };

    const handleDeleteBlock = async (blockId: number) => {
        if (!confirm("ต้องการลบข้อมูลนี้?")) return;

        try {
            await deleteBlock(blockId);
            alert("ลบข้อมูลสำเร็จ!");
            await loadAll();
            await refreshSelectedSection();
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาด");
        }
    };

    const handleEditBlock = (block: any) => {
        const content = parseBlockContent(block.content);
        setCurrentBlock(block);
        setSelectedDataType(content?.type || 'activity');
        setSelectedDataId(content?.data_id?.toString() || "");
        setIsEditingItem(true);
    };

    const refreshSelectedSection = async () => {
        if (!selectedSection || !currentPortfolioID) return;
        const updated = await fetchMyPortfolios();
        const portfolio = updated.data.find((p: any) => p.ID === currentPortfolioID);
        const updatedSection = portfolio?.portfolio_sections?.find((s: any) => s.ID === selectedSection.ID);
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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="sticky top-0 bg-white shadow-md z-40">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-6">
                            <Link href="/student/portfolio" className="text-gray-600 hover:text-gray-900 transition">
                                ← กลับ
                            </Link>
                            <div className="h-6 w-px bg-gray-300"></div>
                            <h1 className="text-lg font-bold text-gray-900">{currentPortfolioName || "Portfolio Sections"}</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-8 mt-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">จัดการ Sections</h1>
                        <p className="text-gray-600 mt-2">
                            เพิ่ม Section และเลือกผลงาน/กิจกรรมเพื่อแสดงในแฟ้มสะสมผลงาน
                        </p>
                    </div>
                    <button
                        onClick={handleCreateSection}
                        className="rounded-lg px-6 py-3 text-sm font-medium text-white transition shadow-md hover:shadow-lg"
                        style={{ backgroundColor: theme.primary }}
                    >
                        <span className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            เพิ่ม Section
                        </span>
                    </button>
                </div>

                {/* Sections Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sections.map((section) => {
                        const blocks = section.section_blocks || [];
                        const hasData = blocks.length > 0;

                        let coverImage = "";
                        let displayData: any = null;
                        let images: any[] = [];
                        let validIndex = 0;

                        // Parse data for the main item (assuming single item enforcement)
                        if (hasData) {
                            const block = blocks[0]; // Primary block
                            const content = parseBlockContent(block.content);
                            const data = content?.data || {};

                            // Try to find cover image from this block
                            images = extractImages(data, content?.type);
                            const activeIndex = imageIndices[section.ID] || 0;
                            validIndex = (activeIndex >= 0 && activeIndex < images.length) ? activeIndex : 0;

                            if (images.length > 0) {
                                coverImage = getImageUrl(images[validIndex]);
                            }

                            // Helper formats
                            const formatDate = (dateString: string) => {
                                if (!dateString) return "";
                                const date = new Date(dateString);
                                return date.toLocaleDateString("th-TH", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                });
                            };

                            // Prepare display data based on types
                            if (content?.type === 'activity') {
                                displayData = {
                                    type: 'activity',
                                    title: data.activity_name,
                                    institution: data.activity_detail?.institution,
                                    date: formatDate(data.activity_detail?.activity_at),
                                    desc: data.activity_detail?.description,
                                    typeName: data.activity_detail?.type_activity?.type_name,
                                    levelName: data.activity_detail?.level_activity?.level_name,
                                    rewardName: data.reward?.level_name
                                };
                            } else {
                                // Working
                                displayData = {
                                    type: 'working',
                                    title: data.working_name,
                                    status: data.status,
                                    typeName: data.working_detail?.type_working?.type_name,
                                    date: formatDate(data.working_detail?.working_at),
                                    desc: data.working_detail?.description,
                                    links: data.working_detail?.links || []
                                };
                            }
                        }

                        return (
                            <div
                                key={section.ID}
                                className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border-2 ${section.is_enabled ? 'border-orange-200' : 'border-gray-200 opacity-60'
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
                                    <div className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 ${section.is_enabled ? 'bg-green-500' : 'bg-gray-300'
                                        }`}>
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${section.is_enabled ? 'translate-x-5' : ''
                                            }`}></div>
                                    </div>
                                </div>

                                {/* Card Preview */}
                                <div
                                    className={`relative overflow-hidden p-0 cursor-pointer ${!section.is_enabled && 'grayscale'}`}
                                    style={{ height: '200px' }}
                                    onClick={() => {
                                        setSelectedSection(section);
                                        const blocks = section.section_blocks || [];
                                        if (blocks.length > 0) {
                                            const firstBlock = blocks[0];
                                            const content = parseBlockContent(firstBlock.content);
                                            setCurrentBlock(firstBlock);
                                            setSelectedDataType(content?.type || 'activity');
                                            setSelectedDataId(content?.data_id?.toString() || "");
                                        } else {
                                            setCurrentBlock(null);
                                            setSelectedDataType('activity');
                                            setSelectedDataId("");
                                        }
                                        setIsEditingItem(true);
                                    }}
                                >
                                    {/* Slider Track */}
                                    {hasData && (
                                        <div
                                            className="flex transition-transform duration-500 ease-in-out h-full w-full"
                                            style={{ transform: `translateX(-${validIndex * 100}%)` }}
                                        >
                                            {images.length > 0 ? (
                                                images.map((img: any, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        className="min-w-full h-full bg-cover bg-center flex-shrink-0"
                                                        style={{
                                                            backgroundImage: `url(${getImageUrl(img)})`
                                                        }}
                                                    />
                                                ))
                                            ) : (
                                                <div
                                                    className="min-w-full h-full bg-cover bg-center flex-shrink-0"
                                                    style={{
                                                        backgroundImage: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`
                                                    }}
                                                />
                                            )}
                                        </div>
                                    )}

                                    {/* Default Gradient if no data */}
                                    {!hasData && (
                                        <div
                                            className="absolute inset-0 z-0"
                                            style={{
                                                background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`
                                            }}
                                        />
                                    )}

                                    {/* Carousel Controls */}
                                    {hasData && extractImages(parseBlockContent(blocks[0].content)?.data, parseBlockContent(blocks[0].content)?.type).length > 1 && (
                                        <>
                                            {/* Left Arrow */}
                                            <div
                                                className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-50 text-white rounded-full p-1 cursor-pointer hover:bg-opacity-70 transition-all hover:scale-110"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const images = extractImages(parseBlockContent(blocks[0].content)?.data, parseBlockContent(blocks[0].content)?.type);
                                                    const currentIdx = imageIndices[section.ID] || 0;
                                                    const newIndex = (currentIdx - 1 + images.length) % images.length;
                                                    setSectionImageIndex(section.ID, newIndex);
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </div>

                                            {/* Right Arrow */}
                                            <div
                                                className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-50 text-white rounded-full p-1 cursor-pointer hover:bg-opacity-70 transition-all hover:scale-110"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const images = extractImages(parseBlockContent(blocks[0].content)?.data, parseBlockContent(blocks[0].content)?.type);
                                                    const currentIdx = imageIndices[section.ID] || 0;
                                                    const newIndex = (currentIdx + 1) % images.length;
                                                    setSectionImageIndex(section.ID, newIndex);
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>

                                            {/* Dots */}
                                            <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center gap-1.5 pointer-events-none">
                                                {extractImages(parseBlockContent(blocks[0].content)?.data, parseBlockContent(blocks[0].content)?.type).map((_, idx) => {
                                                    const currentIdx = imageIndices[section.ID] || 0;
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`w-1.5 h-1.5 rounded-full shadow-sm transition-all ${idx === currentIdx ? 'bg-white scale-125' : 'bg-white bg-opacity-50'}`}
                                                        ></div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}


                                    {/* Show Icon only if NO data */}
                                    {!hasData && (
                                        <div className="text-white h-full flex flex-col justify-center items-center text-center relative z-10 opacity-80">
                                            <div className="text-5xl mb-2 drop-shadow-md">
                                                📭
                                            </div>
                                            <div className="text-sm font-semibold opacity-90 drop-shadow-md">
                                                ยังไม่มีข้อมูล
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-bold text-gray-900 truncate flex-1">
                                            {section.section_title}
                                        </h3>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleSection(section.ID, section.is_enabled);
                                            }}
                                            className={`ml-2 px-2 py-1 rounded-full text-xs font-bold transition-all border ${section.is_enabled
                                                ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                                                : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                                                }`}
                                            title={section.is_enabled ? "คลิกเพื่อซ่อน" : "คลิกเพื่อแสดง"}
                                        >
                                            {section.is_enabled ? '✓' : '✕'}
                                        </button>
                                    </div>

                                    {/* Detailed Item Info */}
                                    {hasData && displayData ? (
                                        <div className="flex-1 flex flex-col gap-2 text-sm text-gray-700">
                                            {/* Badges Row */}
                                            <div className="flex flex-wrap gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase ${displayData.type === 'activity' ? 'bg-orange-500' : 'bg-blue-500'
                                                    }`}>
                                                    {displayData.type}
                                                </span>
                                                {displayData.typeName && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                                        {displayData.typeName}
                                                    </span>
                                                )}
                                                {displayData.levelName && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-600 border border-purple-200">
                                                        {displayData.levelName}
                                                    </span>
                                                )}
                                                {displayData.status && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 uppercase">
                                                        {displayData.status}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Title */}
                                            <div className="font-bold text-base text-gray-900 leading-tight">
                                                {displayData.title || 'ไม่มีชื่อ'}
                                            </div>

                                            {/* Date */}
                                            {displayData.date && (
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    <span>📅</span>
                                                    <span>{displayData.date}</span>
                                                </div>
                                            )}

                                            {/* Institution / Reward (Activity) */}
                                            {(displayData.institution || displayData.rewardName) && (
                                                <div className="flex flex-col gap-1 text-xs">
                                                    {displayData.institution && (
                                                        <div className="flex items-center gap-1.5 text-gray-600">
                                                            <span>🏢</span>
                                                            <span className="truncate">{displayData.institution}</span>
                                                        </div>
                                                    )}
                                                    {displayData.rewardName && (
                                                        <div className="flex items-center gap-1.5 text-orange-600">
                                                            <span>🏆</span>
                                                            <span className="truncate">{displayData.rewardName}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Description */}
                                            {displayData.desc && (
                                                <div className="text-xs text-gray-500 line-clamp-2 mt-1">
                                                    {displayData.desc}
                                                </div>
                                            )}

                                            {/* Working Links */}
                                            {displayData.links && displayData.links.length > 0 && (
                                                <div className="mt-2 text-xs">
                                                    <div className="flex flex-wrap gap-2">
                                                        {displayData.links.map((link: any, i: number) => (
                                                            <a
                                                                key={i}
                                                                href={link.working_link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                🔗 {link.working_link ? new URL(link.working_link).hostname : 'Link'}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="mt-4 text-xs text-gray-400 italic">
                                            คลิก "จัดการข้อมูล" เพื่อเพิ่มข้อมูล
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 text-xs text-gray-300 mt-4 pt-3 border-t border-gray-100">
                                        <span>ID: {section.ID}</span>
                                    </div>
                                </div>






                                {/* Action Buttons */}
                                <div className="px-5 py-3 bg-gray-50 border-t flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteSection(section.ID);
                                        }}
                                        className="px-3 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition border border-red-200"
                                        title="ลบ Section"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedSection(section);
                                            // Auto-select the first block if it exists for editing
                                            const blocks = section.section_blocks || [];
                                            if (blocks.length > 0) {
                                                const firstBlock = blocks[0];
                                                const content = parseBlockContent(firstBlock.content);
                                                setCurrentBlock(firstBlock);
                                                setSelectedDataType(content?.type || 'activity');
                                                setSelectedDataId(content?.data_id?.toString() || "");
                                            } else {
                                                setCurrentBlock(null);
                                                setSelectedDataType('activity');
                                                setSelectedDataId("");
                                            }
                                            setIsEditingItem(true);
                                        }}
                                        className="flex-1 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                                        style={{ backgroundColor: theme.primary }}
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
                        <p className="text-xl text-gray-600 mb-2">ยังไม่มี Sections</p>
                        <p className="text-gray-500">กดปุ่ม "เพิ่ม Section" เพื่อเริ่มต้น</p>
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
                        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b flex items-start justify-between" style={{ background: `linear-gradient(to right, ${theme.primaryLight}, ${theme.primaryLight})` }}>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    {selectedSection.section_title}
                                </h2>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-500">
                                        Section ID: {selectedSection.ID}
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
                            <div className="rounded-lg p-4 border-2" style={{ backgroundColor: theme.primaryLight, borderColor: theme.accent }}>
                                <h3 className="text-sm font-bold mb-3" style={{ color: theme.primaryDark }}>
                                    {currentBlock ? '✏️ แก้ไขข้อมูล (Section นี้มีข้อมูลอยู่แล้ว)' : '➕ เพิ่มข้อมูล (แทนที่ข้อมูลเดิมหากมี)'}
                                </h3>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">ประเภทข้อมูล:</label>
                                        <select
                                            className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                                            style={{ borderColor: theme.accent }}
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

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            เลือก{selectedDataType === 'activity' ? 'กิจกรรม' : 'ผลงาน'}:
                                        </label>
                                        <select
                                            className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                                            style={{ borderColor: theme.accent }}
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

                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSaveItem}
                                            disabled={!selectedDataId}
                                            className="flex-1 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                                            style={{ backgroundColor: theme.primary }}
                                        >
                                            ✓ บันทึกข้อมูล
                                        </button>
                                    </div>
                                </div>
                            </div>
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
    );
}

export default function SectionsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div>Loading...</div></div>}>
            <SectionsContent />
        </Suspense>
    );
}