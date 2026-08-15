import imageCompression from 'browser-image-compression';

export const uploadToImgBB = async (file: File, businessId: string): Promise<string> => {
  let finalFile = file;

  // Compress only if it's an image and larger than 500KB
  if (file.type.startsWith('image/') && file.size > 500 * 1024) {
    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      finalFile = await imageCompression(file, options);
    } catch (e) {
      console.warn('Image compression failed, using original file', e);
    }
  }

  const formData = new FormData();
  formData.append("file", finalFile);
  formData.append("businessId", businessId);
  
  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Upload failed");
  }
  
  const data = await res.json();
  return data.url;
};
