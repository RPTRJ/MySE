"use client";

import React, { useState, useRef, useCallback } from "react";
import { uploadFile } from "@/services/upload";
import { updateProfileImage } from "@/services/profile";

interface ProfileImageUploaderProps {
  currentImageUrl?: string;
  onImageUpdated: (newUrl: string) => void;
}

export function ProfileImageUploader({ currentImageUrl, onImageUpdated }: ProfileImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resize และ crop รูปภาพเป็นวงกลม
  const resizeAndCropImage = useCallback((file: File, targetSize: number = 400): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Cannot get canvas context'));
            return;
          }

          // กำหนดขนาด canvas
          canvas.width = targetSize;
          canvas.height = targetSize;

          // คำนวณการ crop แบบ square
          const size = Math.min(img.width, img.height);
          const x = (img.width - size) / 2;
          const y = (img.height - size) / 2;

          // วาดรูปแบบวงกลม
          ctx.beginPath();
          ctx.arc(targetSize / 2, targetSize / 2, targetSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();

          // วาดรูปภาพ
          ctx.drawImage(img, x, y, size, size, 0, 0, targetSize, targetSize);

          // แปลง canvas เป็น blob
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Cannot create blob from canvas'));
              return;
            }

            // สร้าง File object ใหม่
            const croppedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve(croppedFile);
          }, 'image/jpeg', 0.9);
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพ');
      return;
    }

    // Validate file size (max 5MB for original)
    if (file.size > 5 * 1024 * 1024) {
      setError('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // แสดง preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Resize และ crop รูปภาพ (400x400px)
      const resizedFile = await resizeAndCropImage(file, 400);

      // อัพโหลดไฟล์
      const uploadedUrl = await uploadFile(resizedFile);

      // อัพเดต profile image ใน database
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("ไม่พบ token");
      }

      await updateProfileImage(token, uploadedUrl);

      // แจ้งผลสำเร็จ
      onImageUpdated(uploadedUrl);
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
      setPreview(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative group">
        {/* Profile Image */}
        <div className="relative h-32 w-32 rounded-full overflow-hidden bg-white/20 backdrop-blur-sm border-4 border-white/50">
          {preview ? (
            <img
              src={preview}
              alt="Preview รูปโปรไฟล์"
              className="h-full w-full object-cover"
            />
          ) : currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt="รูปโปรไฟล์"
              className="h-full w-full object-cover"
            />
          ) : (
            <svg
              className="h-full w-full text-white p-6"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-label="ไอคอนโปรไฟล์เริ่มต้น"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          )}

          {/* Overlay on hover */}
          {!isUploading && (
            <div
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={handleClick}
              role="button"
              aria-label="คลิกเพื่อเปลี่ยนรูปโปรไฟล์"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleClick();
                }
              }}
            >
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          )}

          {/* Loading spinner */}
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <svg
                className="animate-spin h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                aria-label="กำลังอัพโหลด"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Edit button */}
        <button
          type="button"
          onClick={handleClick}
          disabled={isUploading}
          className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-orange-500 text-white shadow-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          title="เปลี่ยนรูปโปรไฟล์"
          aria-label="เปลี่ยนรูปโปรไฟล์"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="เลือกไฟล์รูปภาพ"
      />

      {/* Info text */}
      <p className="mt-3 text-xs text-white/80 text-center">
        คลิกที่รูปเพื่อเปลี่ยนรูปโปรไฟล์
        <br />
        รองรับไฟล์ JPG, PNG (สูงสุด 5MB)
      </p>

      {/* Error message */}
      {error && (
        <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}