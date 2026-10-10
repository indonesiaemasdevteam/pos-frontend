"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { compressImage, getYoutubeId, isLikelyImageUrl } from "@/utils/Media";
import toast from "react-hot-toast";
// ─── Types ────────────────────────────────────────────────────────────────────
export type MediaType = "VIDEO" | "IMAGE";
export type ToastSeverity = "success" | "error" | "warning" | "info";

export interface UseMediaFormReturn {
  inputRef: React.RefObject<HTMLInputElement>;
  type: MediaType;
  setType: (v: MediaType) => void;
  useUpload: boolean;
  setUseUpload: (v: boolean) => void;
  urlInput: string;
  setUrlInput: (v: string) => void;
  finalUrl: string;
  setFinalUrl: (v: string) => void;
  error: string;
  setError: (v: string) => void;
  imgPublicId: string;
  imgFolder: string;
  imgWidth: number | null;
  imgHeight: number | null;
  imgBytes: number | null;
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  editor: string;
  setEditor: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  tags: string[];
  setTags: (v: string[]) => void;
  isFeatured: boolean;
  setIsFeatured: (v: boolean) => void;
  sortOrder: number;
  setSortOrder: (v: string) => void;
  isPublished: boolean;
  setIsPublished: (v: boolean) => void;
  loadingValidate: boolean;
  isUploadingImage: boolean;
  isDeletingImage: boolean;
  isSwitchingType: boolean;
  openConfirm: boolean;
  setOpenConfirm: (v: boolean) => void;
  openToast: boolean;
  setOpenToast: (v: boolean) => void;
  toastSeverity: ToastSeverity;
  toastMessage: string;
  submitLoading: boolean;
  submitError: string;
  busy: boolean;
  embedUrl: string | null | undefined;
  canPreview: boolean;
  allFilled: boolean;
  resetUrlInstant: () => void;
  clearImageMeta: () => void;
  deleteUploadedImageIfAny: () => Promise<boolean>;
  handleChangeType: (nextType: MediaType) => Promise<void>;
  handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleResetAll: () => Promise<void>;
  handleSubmit: () => Promise<void>;
  handleCancelConfirm: () => Promise<void>;
}

// ─── Env ──────────────────────────────────────────────────────────────────────
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  folder?: string;
  width?: number;
  height?: number;
  bytes?: number;
  error?: { message: string };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useMediaForm(): UseMediaFormReturn {
  const [type, setType] = useState<MediaType>("VIDEO");
  const [useUpload, setUseUpload] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [finalUrl, setFinalUrl] = useState("");
  const [error, setError] = useState("");

  const [imgPublicId, setImgPublicId] = useState("");
  const [imgFolder, setImgFolder] = useState("");
  const [imgWidth, setImgWidth] = useState<number | null>(null);
  const [imgHeight, setImgHeight] = useState<number | null>(null);
  const [imgBytes, setImgBytes] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editor, setEditor] = useState("");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const [isFeatured, setIsFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState(1);
  const [isPublished, setIsPublished] = useState(true);

  const [loadingValidate, setLoadingValidate] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [isSwitchingType, setIsSwitchingType] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const lastUploadedPublicIdRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const youtubeId = useMemo(() => {
    if (type !== "VIDEO" || !finalUrl) return null;
    return getYoutubeId(finalUrl);
  }, [type, finalUrl]);

  const embedUrl = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}`
    : null;

  const busy =
    loadingValidate ||
    isUploadingImage ||
    isDeletingImage ||
    submitLoading ||
    isSwitchingType;

  const canPreview: boolean = !!(
    !loadingValidate &&
    !isUploadingImage &&
    finalUrl &&
    !error &&
    ((type === "VIDEO" && !!embedUrl) || (type === "IMAGE" && !!finalUrl))
  );

  const allFilled: boolean = !!(
    finalUrl &&
    (type === "VIDEO" ? !!embedUrl : true) &&
    title.trim() &&
    description.trim() &&
    editor.trim() &&
    tags?.length > 0
  );

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const clearImageMeta = () => {
    setImgPublicId("");
    setImgFolder("");
    setImgWidth(null);
    setImgHeight(null);
    setImgBytes(null);
    lastUploadedPublicIdRef.current = null;
  };

  const resetUrlInstant = () => {
    setLoadingValidate(false);
    setUrlInput("");
    setFinalUrl("");
    setError("");
    setSubmitError("");
  };

  const resetAllFieldsExceptType = () => {
    setTitle("");
    setDescription("");
    setEditor("");
    setNote("");
    setTags([]);
    setIsFeatured(false);
    setSortOrder(1);
    setIsPublished(true);
  };

  // Ganti showToast:
  const showToast = (severity: ToastSeverity, message: string) => {
    if (severity === "success") toast.success(message);
    else if (severity === "error") toast.error(message);
    else if (severity === "warning") toast(message, { icon: "⚠️" });
    else toast(message);
  };

  // ── Delete image ──────────────────────────────────────────────────────────────
  const deleteUploadedImage = async (): Promise<boolean> => {
    const publicId = lastUploadedPublicIdRef.current;
    if (!publicId) return true;

    try {
      setIsDeletingImage(true);

      const res = await fetch("/api/apps/media/delete-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id: publicId }),
      });

      const data = (await res.json().catch(() => null)) as {
        message?: string;
        error?: string;
      } | null;

      if (!res.ok) {
        throw new Error(
          data?.message ?? data?.error ?? `Delete failed (${res.status})`
        );
      }

      lastUploadedPublicIdRef.current = null;
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.warn("Failed to delete image from Cloudinary:", err);
      showToast("error", `❌ Gagal delete image: ${msg}`);
      return false;
    } finally {
      setIsDeletingImage(false);
    }
  };

  const deleteUploadedImageIfAny = async (): Promise<boolean> => {
    if (!lastUploadedPublicIdRef.current) return true;
    return deleteUploadedImage();
  };

  // ── Type switching ────────────────────────────────────────────────────────────
  const handleChangeType = async (nextType: MediaType): Promise<void> => {
    if (!nextType || nextType === type) return;
    setIsSwitchingType(true);

    try {
      resetUrlInstant();

      if (type === "IMAGE" && lastUploadedPublicIdRef.current) {
        const ok = await deleteUploadedImage();
        if (!ok) return;
        clearImageMeta();
      }

      setUseUpload(false);
      clearImageMeta();
      resetAllFieldsExceptType();
      setType(nextType);

      setTimeout(() => inputRef.current?.focus(), 50);
    } finally {
      setIsSwitchingType(false);
    }
  };

  // ── URL validation ────────────────────────────────────────────────────────────
  useEffect(() => {
    setError("");
    setSubmitError("");

    if (isSwitchingType) return;
    if (type === "IMAGE" && useUpload) return;

    if (!urlInput) {
      setFinalUrl("");
      return;
    }

    setLoadingValidate(true);

    const timer = setTimeout(() => {
      try {
        new URL(urlInput);

        if (type === "VIDEO") {
          const id = getYoutubeId(urlInput);
          if (!id)
            throw new Error(
              "Link YouTube tidak valid (pastikan ada video id)."
            );
          setFinalUrl(urlInput);
        } else {
          if (!isLikelyImageUrl(urlInput)) {
            throw new Error(
              "Link gambar tidak valid (gunakan URL gambar .jpg/.png/.webp/dll)."
            );
          }
          setFinalUrl(urlInput);
          clearImageMeta();
        }

        setError("");
      } catch (e) {
        setFinalUrl("");
        setError(e instanceof Error ? e.message : "URL tidak valid");
      } finally {
        setLoadingValidate(false);
      }
    }, 650);

    return () => clearTimeout(timer);
  }, [urlInput, type, useUpload, isSwitchingType]);

  // ── Cloudinary upload ─────────────────────────────────────────────────────────
  const uploadToCloudinary = async (file: File): Promise<string> => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error(
        "Cloudinary env belum lengkap: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / UPLOAD_PRESET"
      );
    }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: fd }
    );

    const data = (await res
      .json()
      .catch(() => null)) as CloudinaryUploadResponse | null;
    if (!res.ok)
      throw new Error(data?.error?.message ?? "Failed to upload image");

    lastUploadedPublicIdRef.current = data!.public_id;
    setFinalUrl(data!.secure_url);
    setUrlInput(data!.secure_url);
    setImgPublicId(data!.public_id ?? "");
    setImgFolder(data!.folder ?? "");
    setImgWidth(data!.width ?? null);
    setImgHeight(data!.height ?? null);
    setImgBytes(data!.bytes ?? null);
    setError("");

    return data!.secure_url;
  };

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      setError("❌ Invalid file type. Please upload JPG/PNG/WEBP.");
      return;
    }
    if (file.size > maxSize) {
      setError("❌ File size exceeds 5MB limit.");
      return;
    }

    try {
      setIsUploadingImage(true);
      setError("");

      if (lastUploadedPublicIdRef.current) {
        const ok = await deleteUploadedImage();
        if (!ok) return;
      }
      clearImageMeta();

      let finalFile: File = file;
      if (file.type === "image/jpeg" || file.type === "image/jpg") {
        const compressedBlob = await compressImage(file);
        finalFile = new File([compressedBlob], file.name, {
          type: "image/jpeg",
        });
      }

      await uploadToCloudinary(finalFile);
      showToast("success", "✅ Upload berhasil. Preview siap!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  // ── Form actions ──────────────────────────────────────────────────────────────
  const handleResetAll = async (): Promise<void> => {
    setSubmitError("");
    setOpenConfirm(false);

    if (type === "IMAGE" && lastUploadedPublicIdRef.current) {
      const ok = await deleteUploadedImage();
      if (!ok) return;
    }

    resetUrlInstant();
    clearImageMeta();
    setUseUpload(false);
    resetAllFieldsExceptType();
    showToast("info", "Form direset.");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSubmit = async (): Promise<void> => {
    setSubmitError("");
    setSubmitLoading(true);

    try {
      const payload = {
        type,
        url: finalUrl,
        title: title.trim() || null,
        description: description.trim() || null,
        editor: editor.trim() || null,
        note: note?.trim() || null,
        tags,
        isFeatured,
        sortOrder: Number(sortOrder) || 1,
        isPublished,
        imgPublicId: imgPublicId || null,
        imgFolder: imgFolder || null,
        imgWidth,
        imgHeight,
        imgBytes,
      };

      console.log("📦 PAYLOAD:", JSON.stringify(payload, null, 2));

      const res = await fetch("/api/apps/media/panel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => null)) as {
        message?: string;
        error?: string;
      } | null;

      console.log("📨 STATUS:", res.status);
      console.log("📨 RESPONSE:", data);

      if (!res.ok)
        throw new Error(
          data?.message ?? data?.error ?? "Gagal menyimpan media."
        );

      setOpenConfirm(false);
      showToast("success", "✅ Media berhasil disimpan!");
      lastUploadedPublicIdRef.current = null;
      clearImageMeta();

      setTimeout(() => {
        resetUrlInstant();
        setUseUpload(false);
        resetAllFieldsExceptType();
        window.scrollTo({ top: 0, behavior: "smooth" });
        inputRef.current?.focus();
      }, 250);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Terjadi kesalahan saat submit.";
      setSubmitError(msg);
      showToast("error", msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancelConfirm = async (): Promise<void> => {
    setOpenConfirm(false);

    if (type === "IMAGE" && lastUploadedPublicIdRef.current) {
      const ok = await deleteUploadedImage();
      if (!ok) return;
    }

    resetUrlInstant();
    clearImageMeta();
    setUseUpload(false);
    showToast("info", "Draft dibatalkan & upload dibersihkan.");
  };

  // ── Return ────────────────────────────────────────────────────────────────────
  return {
    inputRef,
    type,
    setType,
    useUpload,
    setUseUpload,
    urlInput,
    setUrlInput,
    finalUrl,
    setFinalUrl,
    error,
    setError,
    imgPublicId,
    imgFolder,
    imgWidth,
    imgHeight,
    imgBytes,
    title,
    setTitle,
    description,
    setDescription,
    editor,
    setEditor,
    note,
    setNote,
    tags,
    setTags,
    isFeatured,
    setIsFeatured,
    sortOrder,
    setSortOrder: (v: string) => setSortOrder(Number(v) || 1),
    isPublished,
    setIsPublished,
    loadingValidate,
    isUploadingImage,
    isDeletingImage,
    isSwitchingType,
    openConfirm,
    setOpenConfirm,

    submitLoading,
    submitError,
    busy,
    embedUrl,
    canPreview,
    allFilled,
    resetUrlInstant,
    clearImageMeta,
    deleteUploadedImageIfAny,
    handleChangeType,
    handleUpload,
    handleResetAll,
    handleSubmit,
    handleCancelConfirm,
  };
}
