import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/core/components/button";
import { Label } from "@/core/components/label";
import { useDropzone } from "react-dropzone";
import { cn } from "@/core/lib/utils";
import { useMupdf } from "./hooks/usePdfWorker";

const MAX_FILE_SIZE = 5;

export default function AddFile() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFile = useMutation(api.files.saveFile);
  const parseResume = useMutation(api.openai.parseResume);
  const createProfile = useMutation(api.profiles.createProfile);
  const [fileSize, setFileSize] = useState(0);
  const { isWorkerInitialized, loadDocument, extractText } = useMupdf();

  const onDrop = (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      const fileSizeMB = selectedFile.size / 1024 / 1024;
      if (fileSizeMB > MAX_FILE_SIZE) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setFileSize(fileSizeMB);
      setFile(selectedFile);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/rtf": [".rtf"],
      "text/rtf": [".rtf"],
      "text/html": [".html"],
      "application/vnd.oasis.opendocument.text": [".odt"],
    },
    maxFiles: 1,
    multiple: false,
  });

  // Function to read the selected file and return an ArrayBuffer
  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.readAsArrayBuffer(file);
    });

  const handleExtract = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      console.log("Extracting text from file...");
      // Read file as an ArrayBuffer
      const buffer = await readFileAsArrayBuffer(file);

      console.log("Loading document into worker...");

      // Load the document into the worker
      await loadDocument(buffer);

      console.log("Extracting text from document...");

      // Extract text from the PDF
      const text = await extractText();

      console.log("Text extracted successfully!");
      console.log("Extracted PDF Text:\n", text);

      // Parse the resume text using OpenAI
      console.log("Parsing resume with OpenAI...");
      const parsedProfile = await parseResume({ resumeText: text });

      // Create the profile in the database
      console.log("Creating profile...");
      await createProfile(parsedProfile);

      toast.success("Resume processed and profile created successfully!");
    } catch (error) {
      console.error("Processing error:", error);
      toast.error("Failed to process the resume.");
    } finally {
      setIsProcessing(false);
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
      setFileSize(0);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "space-y-2 p-6 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25",
          isUploading && "opacity-50 cursor-not-allowed",
        )}
      >
        <input {...getInputProps()} disabled={isUploading} />
        <Label>Upload Resume (PDF, DOC, DOCX, RTF, HTML, ODT)</Label>
        <div className="text-sm text-muted-foreground text-center">
          {isDragActive ? (
            <p>Drop the file here</p>
          ) : (
            <p>Drag and drop a file here, or click to select</p>
          )}
        </div>
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
      <Button
        onClick={handleExtract}
        disabled={!file || !isWorkerInitialized || isProcessing}
        className="w-full"
      >
        {isProcessing ? "Processing Resume..." : "Extract & Create Profile"}
      </Button>
    </div>
  );
}
