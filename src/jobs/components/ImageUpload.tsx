import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/core/components/button";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
}

export const ImageUpload = ({ onImageUpload }: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];

      // Check file size (1MB = 1024 * 1024 bytes)
      if (file.size > 1024 * 1024) {
        toast.error("File size must be less than 1MB");
        return;
      }

      // Check file type
      if (!file.type.match(/^image\/(jpeg|png)$/)) {
        toast.error("Only JPG and PNG files are allowed");
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      onImageUpload(file);
    },
    [onImageUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    maxFiles: 1,
  });

  const removeImage = () => {
    setPreview(null);
  };

  return (
    <div className="w-full">
      {!preview ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary"}`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive
              ? "Drop the image here"
              : "Drag and drop an image here, or click to select"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Only JPG and PNG files up to 1MB
          </p>
        </div>
      ) : (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-auto rounded-lg"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={removeImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
