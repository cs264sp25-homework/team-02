import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/core/components/button";
import { Input } from "@/core/components/input";
import { Label } from "@/core/components/label";

const MAX_FILE_SIZE = 5;

const ALLOWED_FILE_TYPES = {
  // PDF
  "application/pdf": ".pdf",
  // Word documents
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  // RTF
  "application/rtf": ".rtf",
  "text/rtf": ".rtf",
  // HTML
  "text/html": ".html",
  // ODT
  "application/vnd.oasis.opendocument.text": ".odt",
};

export default function AddFile() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFile = useMutation(api.files.saveFile);
  const [fileSize, setFileSize] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileSizeMB = selectedFile.size / 1024 / 1024;

      // Check file size
      if (fileSizeMB > MAX_FILE_SIZE) {
        toast.error("File size must be less than 5MB");
        e.target.value = "";
        return;
      }

      setFileSize(fileSizeMB);

      // Check file type
      const fileType = selectedFile.type;
      if (fileType in ALLOWED_FILE_TYPES) {
        setFile(selectedFile);
      } else {
        toast.error("Supported formats: PDF, DOC, DOCX, RTF, HTML, ODT");
        e.target.value = "";
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      // Get the upload URL from Convex
      const postUrl = await generateUploadUrl();

      // Upload the file to storage
      const result = await fetch(postUrl, {
        method: "POST",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!result.ok) {
        throw new Error(`Upload failed: ${result.statusText}`);
      }

      // Get the storage ID from the response
      const { storageId } = await result.json();

      // Save the file metadata in Convex
      await saveFile({
        storageId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      toast.success("File uploaded successfully!");
      setFile(null);

      // Reset the file input
      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file">
          Upload Resume (PDF, DOC, DOCX, RTF, HTML, ODT)
        </Label>
        <Input
          id="file"
          type="file"
          accept=".pdf,.doc,.docx,.rtf,.html,.odt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/rtf,text/rtf,text/html,application/vnd.oasis.opendocument.text"
          onChange={handleFileChange}
          className="cursor-pointer"
          disabled={isUploading}
        />
      </div>

      {file && (
        <div className="text-sm text-gray-600">
          Selected file: {file.name} ({fileSize.toFixed(2)} MB)
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="w-full"
      >
        {isUploading ? "Uploading..." : "Upload File"}
      </Button>
    </div>
  );
}
