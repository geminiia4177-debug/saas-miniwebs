/**
 * Server-side image upload helper for flyers, logos, and generated assets.
 * Uploads buffers to ImgBB CDN to avoid storing heavy base64 strings in the database.
 * Gracefully falls back to optimized data URIs if ImgBB API key is not configured or fails.
 */
export async function uploadBufferToImgBB(buffer: Buffer, filename: string = "image.jpg"): Promise<string> {
  const key = process.env.IMGBB_API_KEY;

  if (key) {
    try {
      const formData = new FormData();
      // ImgBB accepts base64 string in the "image" field
      formData.append("image", buffer.toString("base64"));
      formData.append("name", filename.replace(/\.[^/.]+$/, ""));

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.data?.url) {
          return data.data.url;
        }
      } else {
        console.warn("ImgBB server upload failed with status:", res.status);
      }
    } catch (err) {
      console.warn("ImgBB server upload error, using fallback:", err);
    }
  }

  // Fallback: return data URI if ImgBB is not available
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}
