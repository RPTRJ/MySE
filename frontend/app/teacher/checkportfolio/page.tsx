"use client";
import { useEffect, useState } from "react";
import { Search, User } from 'lucide-react';

interface User {
  id: number;
  name: string;
  profile_picture?: string;
}

interface Portfolio {
  id: number;
  portfolioname: string;
}

interface PortfolioSubmission {
  id: number;
  version: number;
  status: string;
  submission_at: string;
  reviewed_at?: string;
  approved_at?: string;
  is_current_version: boolean;
  portfolio_id: number;
  portfolio: Portfolio;
  user_id: number;
  user: User;
}

export default function CheckPortfolioPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [loading, setLoading] = useState(false);

  // Mock data - แสดงเฉพาะ status = "รอการตรวจ"
  const portfolioSubmissions: PortfolioSubmission[] = [
    {
      id: 1,
      version: 1,
      status: 'รอการตรวจ',
      submission_at: '2024-12-01T10:00:00Z',
      is_current_version: true,
      portfolio_id: 1,
      portfolio: { id: 1, portfolioname: 'Portfolio ศิลปะดิจิทัล' },
      user_id: 101,
      user: { id: 101, name: 'สมชาย ใจดี', profile_picture: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/%D0%A2%D0%B0%D0%B9%D1%81%D0%BA%D0%B8%D0%B9_%D0%BA%D0%BE%D1%82_%D0%9B%D1%83%D0%BB%D0%B0%D0%BC%D0%B5%D0%B9_%D0%A2%D0%B0%D0%B9%D1%81%D0%BA%D0%B0%D1%8F_%D0%9B%D0%B5%D0%B3%D0%B5%D0%BD%D0%B4%D0%B0%2C_%D0%A7%D0%B5%D0%BC%D0%BF%D0%B8%D0%BE%D0%BD_%D0%BC%D0%B8%D1%80%D0%B0_%D0%BF%D0%BE_%D1%81%D0%B8%D1%81%D1%82%D0%B5%D0%BC%D0%B5_WCF%2C_%D0%BE%D0%BA%D1%80%D0%B0%D1%81_%D0%B1%D0%BB%D1%8E_%D0%BF%D0%BE%D0%B8%D0%BD%D1%82_01_%28cropped%29.jpg' }
    },
    {
      id: 2,
      version: 2,
      status: 'รอการตรวจ',
      submission_at: '2024-12-02T14:30:00Z',
      is_current_version: true,
      portfolio_id: 2,
      portfolio: { id: 2, portfolioname: 'Portfolio การออกแบบ UX/UI' },
      user_id: 102,
      user: { id: 102, name: 'สมหญิง รักเรียน'}
    },
    {
      id: 3,
      version: 1,
      status: 'รอการตรวจ',
      submission_at: '2024-12-03T09:15:00Z',
      is_current_version: true,
      portfolio_id: 3,
      portfolio: { id: 3, portfolioname: 'Portfolio การพัฒนาเว็บไซต์' },
      user_id: 103,
      user: { id: 103, name: 'วิชัย นักเขียน' }
    },
  ];

  // Filter เฉพาะ status = "รอการตรวจ" และ is_current_version = true
  const pendingSubmissions = portfolioSubmissions.filter(
    item => item.status === 'รอการตรวจ' && item.is_current_version
  );

  const categories = ['ทั้งหมด', ...Array.from(new Set(pendingSubmissions.map(item => item.portfolio.portfolioname)))];

  const filteredItems = pendingSubmissions.filter(item => {
    const matchesSearch = 
      item.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.portfolio.portfolioname.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ทั้งหมด' || item.portfolio.portfolioname === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div style={{ padding: '50px' }}>
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4 md:p-8 rounded-2xl ">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-left mb-8">
            <h1 className="text-3xl font-bold text-orange-400">ให้คะแนน Portfolio</h1>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ค้นหาผลงาน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-400  bg-white  focus:outline-none transition-colors"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-6 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none bg-white cursor-pointer transition-colors"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6  ">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className=" p-4 flex items-center gap-3">
                <div className="bg-white/10 backdrop-blur-sm p-2 rounded-full">
                  <img src={item.user.profile_picture} alt="Profile" className="w-10 h-10 rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-black font-medium text-l truncate">{item.user.name}</p>
                  <p className="text-black text-xs truncate">Version {item.version}</p>
                </div>
              </div>

              {/* Image Placeholder */}
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 aspect-square flex items-center justify-center p-4">
                <div className="text-center">
                  <User className="w-16 h-16 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm font-medium mb-1">{item.portfolio.portfolioname}</p>
                  
                </div>
              </div>

              {/* Submission Info */}
              <div className="p-3 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center justify-between text-m text-gray-600">
                  <span>ส่งเมื่อ:</span>
                  <span className="font-medium">{formatDate(item.submission_at)}</span>
                </div>
                <div className="flex items-center justify-center mt-2">
                  
                </div>
              </div>

              
              
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredItems.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <User className="w-20 h-20 mx-auto mb-4" />
              <p className="text-xl">ไม่พบผลงานที่ค้นหา</p>
              <p className="text-sm mt-2">ลองค้นหาด้วยคำค้นอื่น หรือเปลี่ยนหมวดหมู่</p>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}