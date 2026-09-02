import React, { useRef, useState } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Camera,
  FolderOpen,
  X,
  AlertCircle,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface ImageSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (
    dataUrl: string,
    naturalWidth: number,
    naturalHeight: number,
    fileName: string
  ) => void;
  title?: string;
  isReplacing?: boolean;
}

export const ImageSourceModal: React.FC<ImageSourceModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  title = 'Add Image to Canvas',
  isReplacing = false,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const deviceInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const filesInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const validateAndProcessFile = (file: File) => {
    setErrorMessage(null);

    // Validate MIME types and common extensions
    const validMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const validExtensions = /\.(png|jpe?g|webp)$/i;

    const isValidType =
      validMimeTypes.includes(file.type.toLowerCase()) ||
      validExtensions.test(file.name.toLowerCase());

    if (!isValidType) {
      setErrorMessage(
        'Unsupported file format. Please choose a PNG, JPG, JPEG, or WEBP image.'
      );
      return;
    }

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onerror = () => {
      setErrorMessage('Failed to read image file. Please try selecting another file.');
      setIsProcessing(false);
    };

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        setErrorMessage('Failed to load image data.');
        setIsProcessing(false);
        return;
      }

      // Extract natural dimensions while preserving alpha channel transparency
      const img = new Image();
      img.onload = () => {
        setIsProcessing(false);
        onSelectImage(dataUrl, img.naturalWidth || 300, img.naturalHeight || 300, file.name);
        onClose();
      };
      img.onerror = () => {
        setIsProcessing(false);
        setErrorMessage('Failed to decode image. Please check that the file is not corrupted.');
      };
      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
    // Reset value so selecting the same file again triggers change
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  return (
    <div
      id="image-source-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        id="image-source-modal-dialog"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-stone-300 p-4 sm:p-5 flex flex-col gap-3.5 animate-in zoom-in-95 duration-150 overflow-hidden"
        dir="ltr"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden Native File Inputs */}
        <input
          ref={deviceInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleInputChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleInputChange}
          className="hidden"
        />
        <input
          ref={filesInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleInputChange}
          className="hidden"
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center shadow-2xs">
              <ImageIcon size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-stone-900 font-sans leading-tight">
                {title}
              </h2>
              <p className="text-[11px] text-stone-500 font-sans">
                {isReplacing
                  ? 'Replace selected image object on canvas'
                  : 'Import as an editable canvas layer'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Informative Guarantee Banner */}
        <div className="flex items-start gap-2 p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-[11px] text-emerald-900">
          <ShieldCheck size={16} className="text-emerald-700 shrink-0 mt-0.5" />
          <span className="leading-snug">
            <strong>Independent Object:</strong> Uploaded images are placed as editable objects on your canvas. Your canvas background is preserved.
          </span>
        </div>

        {/* Error Alert Message */}
        {errorMessage && (
          <div className="flex items-start gap-2 p-2.5 bg-rose-50 border border-rose-300 rounded-2xl text-[11px] text-rose-900 animate-in fade-in">
            <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
            <span className="font-sans leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => deviceInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer ${
            isDragging
              ? 'border-emerald-600 bg-emerald-100/70 scale-[0.99]'
              : 'border-stone-300 hover:border-emerald-600 hover:bg-emerald-50/40 bg-stone-50'
          }`}
        >
          <div className="w-10 h-10 rounded-2xl bg-white border border-stone-300 flex items-center justify-center shadow-xs text-emerald-700 mb-0.5">
            <Upload size={18} />
          </div>
          <div className="text-xs font-bold text-stone-800 font-sans">
            {isProcessing ? 'Processing image...' : 'Drop image here or click to browse'}
          </div>
          <div className="text-[10.5px] text-stone-500 font-sans">
            Supports PNG (with transparency), JPG, JPEG, and WebP
          </div>
        </div>

        {/* 3 Source Options Grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Option 1: Device Upload */}
          <button
            id="btn-source-upload-device"
            type="button"
            disabled={isProcessing}
            onClick={() => deviceInputRef.current?.click()}
            className="p-3 rounded-2xl border-2 border-stone-300 hover:border-emerald-600 hover:bg-emerald-50/60 bg-white text-stone-800 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 text-emerald-800 flex items-center justify-center transition-colors">
              <Upload size={16} />
            </div>
            <span className="text-xs font-bold font-sans leading-none text-center">
              Upload
            </span>
            <span className="text-[9.5px] text-stone-500 font-sans leading-none">
              From device
            </span>
          </button>

          {/* Option 2: Camera */}
          <button
            id="btn-source-camera"
            type="button"
            disabled={isProcessing}
            onClick={() => cameraInputRef.current?.click()}
            className="p-3 rounded-2xl border-2 border-stone-300 hover:border-emerald-600 hover:bg-emerald-50/60 bg-white text-stone-800 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs group"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 text-indigo-800 flex items-center justify-center transition-colors">
              <Camera size={16} />
            </div>
            <span className="text-xs font-bold font-sans leading-none text-center">
              Camera
            </span>
            <span className="text-[9.5px] text-stone-500 font-sans leading-none">
              Take photo
            </span>
          </button>

          {/* Option 3: Files */}
          <button
            id="btn-source-files"
            type="button"
            disabled={isProcessing}
            onClick={() => filesInputRef.current?.click()}
            className="p-3 rounded-2xl border-2 border-stone-300 hover:border-emerald-600 hover:bg-emerald-50/60 bg-white text-stone-800 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 group-hover:bg-amber-100 text-amber-800 flex items-center justify-center transition-colors">
              <FolderOpen size={16} />
            </div>
            <span className="text-xs font-bold font-sans leading-none text-center">
              Files
            </span>
            <span className="text-[9.5px] text-stone-500 font-sans leading-none">
              Browse storage
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
