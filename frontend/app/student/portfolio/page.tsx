"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";

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

async function createPortfolio(data: { portfolio_name: string }) {
    const response = await fetch(`${API}/portfolio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create portfolio");
    return response.json();
}

async function uploadImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API}/upload`, {
        method: "POST",
        body: formData,
    });
    if (!response.ok) throw new Error("Failed to upload image");
    return response.json();
}

async function updatePortfolio(id: number, data: any) {
    const response = await fetch(`${API}/portfolio/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update portfolio");
    return response.json();
}

export default function MyPortfoliosPage() {
    const [portfolios, setPortfolios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newPortfolioName, setNewPortfolioName] = useState("");
    const [selectedPortfolio, setSelectedPortfolio] = useState<any>(null);
    const [itemImageIndices, setItemImageIndices] = useState<{ [key: number]: number }>({});
    const [lightboxState, setLightboxState] = useState<{ isOpen: boolean; images: any[]; photoIndex: number }>({ isOpen: false, images: [], photoIndex: 0 });
    const router = useRouter();

    const loadPortfolios = async () => {
        try {
            setLoading(true);
            const data = await fetchMyPortfolios();

            const customPortfolios = (data.data || []).filter((p: any) => {
                const hasTemplate = p.template_id || p.TemplateID;
                return !hasTemplate;
            });

            console.log("📦 Custom Portfolios loaded:", customPortfolios.length);
            setPortfolios(customPortfolios);
            setLoading(false);
        } catch (err) {
            console.error("Error loading portfolios:", err);
            setLoading(false);
        }
    };

    const handleCreatePortfolio = async () => {
        if (!newPortfolioName.trim()) {
            alert("กรุณากรอกชื่อแฟ้มสะสมผลงาน");
            return;
        }

        try {
            const result = await createPortfolio({ portfolio_name: newPortfolioName });
            const newPortfolio = result.data;

            alert("สร้างแฟ้มสะสมผลงานสำเร็จ!");
            setIsCreateModalOpen(false);
            setNewPortfolioName("");

            if (newPortfolio?.ID) {
                router.push(`/student/portfolio/section?portfolio_id=${newPortfolio.ID}`);
            } else {
                loadPortfolios();
            }
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาดในการสร้างแฟ้ม");
        }
    };

    const getSectionsCount = (portfolio: any) => {
        const sections = portfolio.portfolio_sections || portfolio.PortfolioSections || [];
        return sections.filter((s: any) => s.is_enabled !== false).length;
    };

    const getBlocksCount = (portfolio: any) => {
        const sections = portfolio.portfolio_sections || portfolio.PortfolioSections || [];
        let totalBlocks = 0;
        sections.forEach((section: any) => {
            const blocks = section.portfolio_blocks || section.PortfolioBlocks || [];
            totalBlocks += blocks.length;
        });
        return totalBlocks;
    };

    const parseBlockContent = (content: any): any => {
        if (!content) return null;
        if (typeof content === 'string') {
            try {
                return JSON.parse(content);
            } catch (e) {
                return null;
            }
        }
        return content;
    };

    const getImageUrl = (image: any): string => {
        return image?.file_path || image?.FilePath || image?.image_url || image?.ImageUrl || image?.working_image_url || '/placeholder.jpg';
    };

    const extractImages = (data: any, type: 'activity' | 'working'): any[] => {
        if (!data) return [];
        let images = [];
        if (type === 'activity') {
            images = data.ActivityDetail?.Images || data.activity_detail?.images || [];
        } else {
            images = data.WorkingDetail?.Images || data.working_detail?.images || [];
        }
        return Array.isArray(images) ? images : [];
    };

    useEffect(() => {
        loadPortfolios();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="text-5xl mb-4">📚</div>
                    <div className="text-lg text-gray-600">กำลังโหลดแฟ้มสะสมผลงาน...</div>
                </div>
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
                            <h1 className="text-xl font-bold text-gray-900">แฟ้มสะสมผลงานของฉัน</h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-6">
                <div className="flex items-center justify-between mb-8 mt-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">แฟ้มทั้งหมด</h2>
                        <p className="text-gray-600 mt-2">
                            จัดการและแสดงผลแฟ้มสะสมผลงานของคุณ
                        </p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="rounded-lg px-6 py-3 text-sm font-medium text-white transition shadow-md hover:shadow-lg"
                        style={{ backgroundColor: theme.primary }}
                    >
                        <span className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            สร้างแฟ้มใหม่
                        </span>
                    </button>
                </div>

                {/* Portfolios Grid */}
                {portfolios.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {portfolios.map((portfolio) => {
                            const sectionsCount = getSectionsCount(portfolio);
                            const blocksCount = getBlocksCount(portfolio);
                            const status = portfolio.status || 'draft';

                            return (
                                <div
                                    key={portfolio.ID}
                                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border-2 hover:border-opacity-100"
                                    style={{ borderColor: theme.primaryLight }}
                                >
                                    {/* Header Image/Preview */}
                                    {/* Header Image/Preview */}
                                    <div
                                        className="h-56 relative flex items-center justify-center bg-gray-100 group"
                                    >
                                        {/* Main Image Area - Click to View */}
                                        <div
                                            className="w-full h-full cursor-pointer overflow-hidden"
                                            onClick={() => {
                                                const imgUrl = portfolio.cover_image || portfolio.CoverImage;
                                                if (imgUrl) {
                                                    setLightboxState({
                                                        isOpen: true,
                                                        images: [{ image_url: imgUrl }],
                                                        photoIndex: 0
                                                    });
                                                }
                                            }}
                                        >
                                            {portfolio.cover_image || portfolio.CoverImage ? (
                                                <img
                                                    src={portfolio.cover_image || portfolio.CoverImage}
                                                    alt="Cover"
                                                    className="w-full h-full object-contain bg-gray-200 transition-transform duration-500 group-hover:scale-105"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.parentElement?.classList.add('fallback-gradient');
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    className="absolute inset-0 flex items-center justify-center p-4 content-placeholder"
                                                    style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` }}
                                                >
                                                    <div className="text-white text-center">
                                                        <div className="text-6xl font-bold opacity-30 mb-2">📚</div>
                                                        <div className="text-sm font-bold bg-white rounded-full px-3 py-1 inline-block shadow-sm" style={{ color: theme.primary }}>
                                                            {sectionsCount} Sections • {blocksCount} Items
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Upload Button at Corner */}
                                        <button
                                            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md text-gray-600 hover:text-primary hover:bg-gray-50 transition-all duration-200 z-10 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                document.getElementById(`cover-upload-${portfolio.ID}`)?.click();
                                            }}
                                            title="เปลี่ยนรูปปก"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </button>

                                        <input
                                            type="file"
                                            id={`cover-upload-${portfolio.ID}`}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    e.stopPropagation(); // prevent bubbling if needed
                                                    try {
                                                        const file = e.target.files[0];
                                                        const uploadRes = await uploadImage(file);
                                                        if (uploadRes.url) {
                                                            await updatePortfolio(portfolio.ID, { cover_image: uploadRes.url });
                                                            loadPortfolios(); // Reload to see changes
                                                        }
                                                    } catch (err) {
                                                        console.error("Upload failed", err);
                                                        alert("อัปโหลดรูปภาพไม่สำเร็จ");
                                                    } finally {
                                                        // Reset the input value so the same file can be selected again if needed
                                                        e.target.value = '';
                                                    }
                                                }
                                            }}
                                            onClick={(e) => e.stopPropagation()} // Stop propagation
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="text-xl font-bold text-gray-900 flex-1 truncate pr-2">
                                                {portfolio.portfolio_name || portfolio.PortfolioName || 'ไม่มีชื่อ'}
                                            </h3>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${status === 'active'
                                                ? 'bg-green-100 text-g-700'
                                                : 'bg-gray-100 text-gr00'
                                                }`}>
                                                {status === 'active' ? '✓ เผยแพร่' : '📝 แบบร่าง'}
                                            </span>
                                        </div>

                                        {portfolio.description && (
                                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                                {portfolio.description}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                                </svg>
                                                <span>{sectionsCount} sections</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <span>{blocksCount} items</span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => router.push(`/student/portfolio/section?portfolio_id=${portfolio.ID}`)}
                                                className="flex-1 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                                                style={{ backgroundColor: theme.primary }}
                                            >
                                                📝 จัดการเนื้อหา
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedPortfolio(portfolio);
                                                }}
                                                className="px-4 py-2 border-2 rounded-lg text-sm font-medium transition"
                                                style={{ borderColor: theme.primary, color: theme.primary }}
                                            >
                                                👁️ ดูรายละเอียด
                                            </button>
                                        </div>
                                    </div>

                                    {/* Footer Info */}
                                    <div className="px-5 py-3 border-t text-xs text-gray-500" style={{ backgroundColor: theme.primaryLight }}>
                                        <div className="flex items-center justify-between">
                                            <span>ID: {portfolio.ID}</span>
                                            <span>อัปเดต: {new Date(portfolio.updated_at || portfolio.UpdatedAt).toLocaleDateString('th-TH')}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="text-gray-400 text-6xl mb-4">📚</div>
                        <p className="text-xl text-gray-600 mb-2">ยังไม่มีแฟ้มสะสมผลงาน</p>
                        <p className="text-gray-500 mb-6">เริ่มต้นสร้างแฟ้มของคุณเพื่อรวบรวมผลงานและกิจกรรม</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="text-white px-6 py-3 rounded-lg font-medium transition inline-flex items-center gap-2"
                            style={{ backgroundColor: theme.primary }}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            สร้างแฟ้มแรก
                        </button>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">สร้างแฟ้มสะสมผลงานใหม่</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ชื่อแฟ้ม <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none transition"
                                    style={{
                                        borderColor: 'rgb(209, 213, 219)'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = theme.primary}
                                    onBlur={(e) => e.target.style.borderColor = 'rgb(209, 213, 219)'}
                                    placeholder="เช่น แฟ้มผลงานปี 2025"
                                    value={newPortfolioName}
                                    onChange={(e) => setNewPortfolioName(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleCreatePortfolio();
                                        }
                                    }}
                                    autoFocus
                                />
                            </div>

                            <div className="rounded-lg p-3" style={{ backgroundColor: theme.primaryLight, borderColor: theme.accent, borderWidth: '1px' }}>
                                <p className="text-sm" style={{ color: theme.primaryDark }}>
                                    💡 <strong>คำแนะนำ:</strong> หลังจากสร้างแฟ้ม คุณจะสามารถเพิ่ม Sections และเลือกผลงาน/กิจกรรมเข้าไปได้
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => {
                                    setIsCreateModalOpen(false);
                                    setNewPortfolioName("");
                                }}
                                className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleCreatePortfolio}
                                className="px-6 py-2.5 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition"
                                style={{ backgroundColor: theme.primary }}
                            >
                                สร้างแฟ้ม
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal - Portfolio Detail */}
            {selectedPortfolio && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedPortfolio(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b flex items-start justify-between" style={{ background: `linear-gradient(to right, ${theme.primaryLight}, ${theme.primaryLight})` }}>
                            <div className="flex-1">
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                    {selectedPortfolio.portfolio_name || selectedPortfolio.PortfolioName || 'ไม่มีชื่อ'}
                                </h2>
                                {selectedPortfolio.description && (
                                    <p className="text-gray-600 mb-3">{selectedPortfolio.description}</p>
                                )}
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${selectedPortfolio.status === 'active'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {selectedPortfolio.status === 'active' ? '✓ เผยแพร่' : '📝 แบบร่าง'}
                                    </span>
                                    <span className="text-sm text-gray-500">Portfolio ID: {selectedPortfolio.ID}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedPortfolio(null)}
                                className="text-gray-400 hover:text-gray-600 text-3xl leading-none ml-4"
                            >
                                ×
                            </button>
                        </div>

                        {/* Content - Sections */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {(() => {
                                const sections = (selectedPortfolio.portfolio_sections || selectedPortfolio.PortfolioSections || [])
                                    .filter((s: any) => s.is_enabled === true)
                                    .sort((a: any, b: any) => (a.section_order || 0) - (b.section_order || 0));

                                if (sections.length === 0) {
                                    return (
                                        <div className="text-center py-12">
                                            <div className="text-5xl mb-3">🔭</div>
                                            <p className="text-xl text-gray-600 mb-2">ยังไม่มี Sections ในแฟ้มนี้</p>
                                            <p className="text-gray-500 mb-6">เริ่มเพิ่ม Sections เพื่อแสดงผลงานและกิจกรรม</p>
                                            <button
                                                onClick={() => {
                                                    setSelectedPortfolio(null);
                                                    router.push(`/student/portfolio/section?portfolio_id=${selectedPortfolio.ID}`);
                                                }}
                                                className="text-white px-6 py-3 rounded-lg font-medium"
                                                style={{ backgroundColor: theme.primary }}
                                            >
                                                ไปจัดการ Sections
                                            </button>
                                        </div>
                                    );
                                }

                                return (
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                                <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: theme.primary }}>
                                                    {sections.length}
                                                </span>
                                                Sections ทั้งหมด
                                            </h3>
                                            <button
                                                onClick={() => {
                                                    setSelectedPortfolio(null);
                                                    router.push(`/student/portfolio/section?portfolio_id=${selectedPortfolio.ID}`);
                                                }}
                                                className="text-sm font-medium flex items-center gap-1"
                                                style={{ color: theme.primary }}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                จัดการ
                                            </button>
                                        </div>

                                        <div className="space-y-6">
                                            {sections.map((section: any, sectionIndex: number) => {
                                                const blocks = section.portfolio_blocks || section.PortfolioBlocks || [];

                                                return (
                                                    <div
                                                        key={section.ID}
                                                        className="border-2 rounded-xl p-5 transition bg-white"
                                                        style={{ borderColor: theme.primaryLight }}
                                                    >
                                                        {/* Section Header */}
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: theme.accent }}>
                                                                        Section {sectionIndex + 1}
                                                                    </span>
                                                                    <h4 className="text-lg font-bold text-gray-900">
                                                                        {section.section_title || section.SectionTitle || 'ไม่มีชื่อ'}
                                                                    </h4>
                                                                </div>
                                                                <p className="text-sm text-gray-500">
                                                                    {blocks.length} รายการ
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Blocks Display */}
                                                        {blocks.length > 0 ? (
                                                            <div className="space-y-3">
                                                                {blocks.map((block: any, blockIndex: number) => {
                                                                    const contents = parseBlockContent(block.content || block.Content);
                                                                    if (!contents) return null;

                                                                    const data = contents.data || {};
                                                                    const images = extractImages(data, contents.type);

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

                                                                    let displayData: any = null;
                                                                    if (contents.type === 'activity') {
                                                                        displayData = {
                                                                            type: 'activity',
                                                                            title: data.activity_name,
                                                                            institution: data.activity_detail?.institution || data.ActivityDetail?.Institution,
                                                                            date: formatDate(data.activity_detail?.activity_at || data.ActivityDetail?.ActivityAt),
                                                                            desc: data.activity_detail?.description || data.ActivityDetail?.Description,
                                                                            typeName: data.activity_detail?.type_activity?.type_name || data.ActivityDetail?.TypeActivity?.TypeName,
                                                                            levelName: data.activity_detail?.level_activity?.level_name || data.ActivityDetail?.LevelActivity?.LevelName,
                                                                            rewardName: data.reward?.level_name || data.Reward?.LevelName
                                                                        };
                                                                    } else {
                                                                        displayData = {
                                                                            type: 'working',
                                                                            title: data.working_name,
                                                                            status: data.status,
                                                                            typeName: data.working_detail?.type_working?.type_name || data.WorkingDetail?.TypeWorking?.TypeName,
                                                                            date: formatDate(data.working_detail?.working_at || data.WorkingDetail?.WorkingAt),
                                                                            desc: data.working_detail?.description || data.WorkingDetail?.Description,
                                                                            links: data.working_detail?.links || data.WorkingDetail?.Links || []
                                                                        };
                                                                    }

                                                                    return (
                                                                        <div
                                                                            key={block.ID}
                                                                            className="border rounded-lg p-4 transition hover:shadow-md bg-white"
                                                                            style={{ borderColor: theme.primaryLight }}
                                                                        >
                                                                            <div className="flex items-start gap-4">
                                                                                {/* Images Preview */}
                                                                                {images.length > 0 && (
                                                                                    <div className="flex-shrink-0">
                                                                                        <div
                                                                                            className={`w-24 h-24 rounded-lg overflow-hidden bg-gray-200 border border-gray-100 relative group ${images.length > 1 ? 'cursor-pointer' : ''}`}
                                                                                            onClick={(e) => {
                                                                                                if (images.length > 1) {
                                                                                                    e.stopPropagation();
                                                                                                    setItemImageIndices(prev => {
                                                                                                        const currentIndex = prev[block.ID] || 0;
                                                                                                        return { ...prev, [block.ID]: (currentIndex + 1) % images.length };
                                                                                                    });
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            <div
                                                                                                className="flex transition-transform duration-300 ease-in-out h-full"
                                                                                                style={{
                                                                                                    transform: `translateX(-${(itemImageIndices[block.ID] || 0) * 100}%)`,
                                                                                                    width: `${images.length * 100}%`
                                                                                                }}
                                                                                            >
                                                                                                {images.map((img: any, idx: number) => (
                                                                                                    <div key={idx} className="w-full h-full flex-shrink-0 relative">
                                                                                                        <img
                                                                                                            src={getImageUrl(img)}
                                                                                                            alt={`Preview ${idx + 1}`}
                                                                                                            className="w-full h-full object-cover"
                                                                                                            onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }}
                                                                                                        />
                                                                                                    </div>
                                                                                                ))}
                                                                                            </div>

                                                                                            {/* Expand Button Overlay */}
                                                                                            <button
                                                                                                className="absolute top-1 right-1 p-1 bg-black bg-opacity-50 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-opacity-70"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    setLightboxState({
                                                                                                        isOpen: true,
                                                                                                        images: images,
                                                                                                        photoIndex: itemImageIndices[block.ID] || 0
                                                                                                    });
                                                                                                }}
                                                                                                title="ดูรูปภาพขนาดใหญ่"
                                                                                            >
                                                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                                                                                </svg>
                                                                                            </button>

                                                                                            {/* Optional: Indicator dots or overlays could go here if needed, but keeping it clean for now */}
                                                                                        </div>
                                                                                        {images.length > 1 && (
                                                                                            <div className="text-xs text-gray-500 text-center mt-1 font-medium select-none">
                                                                                                {(itemImageIndices[block.ID] || 0) + 1} / {images.length} รูป
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                )}

                                                                                {/* Content Info */}
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="flex items-center gap-2 mb-1">
                                                                                        <h5 className="font-bold text-lg text-gray-900 truncate">
                                                                                            {displayData.title || 'ไม่มีชื่อ'}
                                                                                        </h5>
                                                                                        {displayData.status && (
                                                                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${displayData.status === 'COMPLETED' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                                                                                displayData.status === 'INPROGRESS' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                                                                                                }`}>
                                                                                                {displayData.status}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>

                                                                                    {/* Badges Row */}
                                                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase ${displayData.type === 'activity' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                                                                                            {displayData.type}
                                                                                        </span>
                                                                                        {displayData.typeName && (
                                                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                                                                                {displayData.typeName}
                                                                                            </span>
                                                                                        )}
                                                                                        {displayData.levelName && (
                                                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-100">
                                                                                                {displayData.levelName}
                                                                                            </span>
                                                                                        )}
                                                                                        {displayData.rewardName && (
                                                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1">
                                                                                                🏆 {displayData.rewardName}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>

                                                                                    {/* Details */}
                                                                                    <div className="text-sm text-gray-600 space-y-1">
                                                                                        {displayData.institution && (
                                                                                            <div className="flex items-center gap-2">
                                                                                                <span className="text-gray-400">🏢</span>
                                                                                                <span>{displayData.institution}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {displayData.date && (
                                                                                            <div className="flex items-center gap-2">
                                                                                                <span className="text-gray-400">🗓</span>
                                                                                                <span>{displayData.date}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {displayData.desc && (
                                                                                            <p className="text-gray-500 mt-1 line-clamp-2 text-xs">
                                                                                                {displayData.desc}
                                                                                            </p>
                                                                                        )}
                                                                                        {/* Links */}
                                                                                        {displayData.links && displayData.links.length > 0 && (
                                                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                                                {displayData.links.map((link: any, i: number) => (
                                                                                                    <a
                                                                                                        key={i}
                                                                                                        href={link.working_link}
                                                                                                        target="_blank"
                                                                                                        rel="noopener noreferrer"
                                                                                                        className="flex items-center gap-1 text-xs text-blue-500 hover:underline bg-blue-50 px-2 py-1 rounded"
                                                                                                    >
                                                                                                        🔗 Link {i + 1}
                                                                                                    </a>
                                                                                                ))}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                {/* Order Badge */}
                                                                                <div className="flex-shrink-0">
                                                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white text-xs font-bold shadow-sm" style={{ border: `1px solid ${theme.primary}`, color: theme.primary }}>
                                                                                        {blockIndex + 1}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                                                <div className="text-3xl mb-2">🔭</div>
                                                                <p className="text-sm text-gray-500">ยังไม่มีข้อมูลใน Section นี้</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                                อัปเดตล่าสุด: {new Date(selectedPortfolio.updated_at || selectedPortfolio.UpdatedAt).toLocaleString('th-TH')}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedPortfolio(null)}
                                    className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition"
                                >
                                    ปิด
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedPortfolio(null);
                                        router.push(`/student/portfolio/section?portfolio_id=${selectedPortfolio.ID}`);
                                    }}
                                    className="px-6 py-2.5 rounded-lg text-white font-medium transition"
                                    style={{ backgroundColor: theme.primary }}
                                >
                                    จัดการเนื้อหา
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Lightbox Modal */}
            {lightboxState.isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center p-4"
                    onClick={() => setLightboxState(prev => ({ ...prev, isOpen: false }))}
                >
                    <button
                        className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-50 p-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            setLightboxState(prev => ({ ...prev, isOpen: false }));
                        }}
                    >
                        ×
                    </button>

                    <div
                        className="relative w-full max-w-5xl max-h-full flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {lightboxState.images.length > 1 && (
                            <button
                                className="absolute left-2 text-white p-3 rounded-full bg-black bg-opacity-40 hover:bg-opacity-70 transition z-50 md:-left-16"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxState(prev => ({
                                        ...prev,
                                        photoIndex: (prev.photoIndex + prev.images.length - 1) % prev.images.length,
                                    }));
                                }}
                            >
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}

                        <div className="relative max-h-[85vh] max-w-full">
                            <img
                                src={getImageUrl(lightboxState.images[lightboxState.photoIndex])}
                                alt="Full size"
                                className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
                                onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }}
                            />
                            {lightboxState.images.length > 0 && (
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-1 rounded-full text-sm">
                                    {lightboxState.photoIndex + 1} / {lightboxState.images.length}
                                </div>
                            )}
                        </div>

                        {lightboxState.images.length > 1 && (
                            <button
                                className="absolute right-2 text-white p-3 rounded-full bg-black bg-opacity-40 hover:bg-opacity-70 transition z-50 md:-right-16"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxState(prev => ({
                                        ...prev,
                                        photoIndex: (prev.photoIndex + 1) % prev.images.length,
                                    }));
                                }}
                            >
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}