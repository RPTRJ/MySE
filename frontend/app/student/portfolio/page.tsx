"use client";



//เหลือแก้หลายอย่าง
export default function PortfolioPage() {
    const cards = [1, 2, 3, 4, 5, 6]; // ตัวอย่างข้อมูลการ์ดแฟ้มสะสมผลงาน
    return (
        <div className="p-6">
            <div className="flex w-full items-center justify-between p-3 ">
                <div className="flex p-2">
                    hello Portfolio Page
                    
                </div>
                <button 
                    type = "button"
                    className="ml-4 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                    สร้าง portfolio ใหม่
                </button>
            </div>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((i) => (
                    <div key={i} className="bg-white rounded-lg shadow p-4 flex flex-col">
                        <div className="h-40 bg-gray-100 rounded mb-4 flex items-center justify-center text-gray-400">
                            รูปตัวอย่าง
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Portfolio {i}</h3>
                        <p className="text-sm text-gray-600 flex-1">
                            คำอธิบายสั้น ๆ ของแฟ้มสะสมผลงานนี้ — ใส่รายละเอียดเพิ่มเติมได้
                        </p>
                        <div className="mt-4 flex justify-end">
                            <button className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700">
                                ดูรายละเอียด
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
    