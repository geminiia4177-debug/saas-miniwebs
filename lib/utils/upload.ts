export const uploadToImgBB = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  
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
