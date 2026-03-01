import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export type ImageSize = "thumbnail" | "small" | "medium" | "large";

export interface UploadedImage {
  thumbnail?: string;
  small?: string;
  medium?: string;
  large?: string;
}

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadMutation = trpc.images.upload.useMutation();

  const uploadImage = async (
    file: File,
    key: string,
    sizes?: ImageSize[]
  ): Promise<UploadedImage | null> => {
    try {
      setIsUploading(true);
      setProgress(0);

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("Resim boyutu 10MB'dan küçük olmalıdır");
        return null;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Lütfen geçerli bir resim dosyası seçin");
        return null;
      }

      setProgress(30);

      // Convert to base64
      const base64 = await fileToBase64(file);

      setProgress(60);

      // Upload
      const result = await uploadMutation.mutateAsync({
        image: base64,
        key,
        sizes,
      });

      setProgress(100);
      toast.success("Resim başarıyla yüklendi");

      return result.urls;
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast.error(error.message || "Resim yüklenirken hata oluştu");
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return {
    uploadImage,
    isUploading,
    progress,
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
