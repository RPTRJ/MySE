const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Upload file to backend server
 * @param file - File to upload
 * @returns Promise with uploaded file URL
 */
export async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    
    const response = await fetch(`${API}/upload`, {
        method: 'POST',
        headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
    });
    
    if (!response.ok) {
        throw new Error("Failed to upload file");
    }
    
    const data = await response.json();
    return data.url;
}

/**
 * Upload image file to backend server
 * @param file - Image file to upload
 * @returns Promise with uploaded image URL
 */
export async function uploadImage(file: File): Promise<string> {
    // Validate image file extension (works in all browsers including Edge)
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    // Edge may not set file.type correctly, so we primarily check extension
    if (!hasValidExtension) {
        throw new Error("File must be an image (JPG, PNG, GIF, WEBP, SVG, BMP, ICO)");
    }
    
    return uploadFile(file);
}
