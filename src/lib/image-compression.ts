/**
 * Client-side image compression and resizing utility.
 * Optimizes images directly in the browser before upload to prevent upload timeouts,
 * eliminate payload size issues, and provide instant visual feedback.
 */

export async function compressImageClient(
  file: File,
  maxWidth = 1600,
  maxHeight = 1200,
  quality = 0.82
): Promise<{ file: File; dataUrl: string }> {
  // Return early if not in browser or not an image
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return { file, dataUrl: "" };
  }

  // Preserve vector SVG or animated GIF
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
    return { file, dataUrl };
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Calculate proportional dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ file, dataUrl: "" });
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      const outputMime = "image/webp";
      let dataUrl = "";
      try {
        dataUrl = canvas.toDataURL(outputMime, quality);
      } catch {
        dataUrl = canvas.toDataURL("image/jpeg", quality);
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({ file, dataUrl });
            return;
          }

          const cleanName =
            file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "-") +
            ".webp";

          const compressedFile = new File([blob], cleanName, {
            type: outputMime,
            lastModified: Date.now(),
          });

          resolve({ file: compressedFile, dataUrl });
        },
        outputMime,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ file, dataUrl: "" });
    };

    img.src = objectUrl;
  });
}
