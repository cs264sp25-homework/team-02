import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/core/components/button";
import { Label } from "@/core/components/label";
import { useDropzone } from "react-dropzone";
import { cn } from "@/core/lib/utils";
import { useMupdf } from "./hooks/usePdfWorker";
import { useAuth } from "@/linkedin/hooks/useAuth";
import { useRouter } from "@/core/hooks/use-router";

const MAX_FILE_SIZE = 5;

export default function AddFile() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFile = useMutation(api.files.saveFile);
  const parseResume = useAction(api.openai.parseResume);
  const createProfile = useMutation(api.profiles.createProfile);
  const [fileSize, setFileSize] = useState(0);
  const { isWorkerInitialized, loadDocument, extractText } = useMupdf();
  const { isAuthenticated, user } = useAuth();
  const { redirect } = useRouter();

  if (!isAuthenticated || !user) {
    redirect("login");
  }

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
      // "application/msword": [".doc"],
      // "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      //   [".docx"],
      // "application/rtf": [".rtf"],
      // "text/rtf": [".rtf"],
      // "text/html": [".html"],
      // "application/vnd.oasis.opendocument.text": [".odt"],
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

      // Read file as an ArrayBuffer
      const buffer = await readFileAsArrayBuffer(file);

      // Load the document into the worker
      await loadDocument(buffer);

      // Extract text from the PDF
      const text = await extractText();

      const parsedProfile = await parseResume({ resumeText: text });

      try {
        // Transform education to ensure fields match expected types
        const transformedEducation = Array.isArray(parsedProfile.education)
          ? parsedProfile.education.map((edu) => ({
              institution: edu.institution || "Unknown Institution",
              degree: edu.degree || "Unknown Degree",
              field: edu.field || "Unknown Field",
              startDate: edu.startDate || "2023-01",
              // Only include optional fields if they're strings
              ...(typeof edu.endDate === "string"
                ? { endDate: edu.endDate }
                : {}),
              ...(typeof edu.gpa === "number" ? { gpa: edu.gpa } : {}),
              ...(typeof edu.description === "string"
                ? { description: edu.description }
                : {}),
              ...(typeof edu.location === "string"
                ? { location: edu.location }
                : {}),
            }))
          : [];

        // Transform work experience to ensure fields match expected types
        const transformedWorkExperience = Array.isArray(
          parsedProfile.workExperience,
        )
          ? parsedProfile.workExperience.map((work) => ({
              company: work.company || "Unknown Company",
              position: work.position || "Unknown Position",
              startDate: work.startDate || "2023-01",
              current: typeof work.current === "boolean" ? work.current : true,
              description: Array.isArray(work.description)
                ? work.description
                : [],
              // Only include optional fields if they're valid
              ...(typeof work.location === "string"
                ? { location: work.location }
                : {}),
              ...(typeof work.endDate === "string"
                ? { endDate: work.endDate }
                : {}),
              ...(Array.isArray(work.technologies)
                ? { technologies: work.technologies }
                : {}),
            }))
          : [];

        // Transform projects to ensure fields match expected types
        const transformedProjects = Array.isArray(parsedProfile.projects)
          ? parsedProfile.projects.map((proj) => ({
              name: proj.name || "Unnamed Project",
              description: Array.isArray(proj.description)
                ? proj.description
                : [],
              technologies: Array.isArray(proj.technologies)
                ? proj.technologies
                : [],
              // Only include optional fields if they're valid
              ...(typeof proj.startDate === "string"
                ? { startDate: proj.startDate }
                : {}),
              ...(typeof proj.endDate === "string"
                ? { endDate: proj.endDate }
                : {}),
              ...(typeof proj.link === "string" ? { link: proj.link } : {}),
              ...(typeof proj.githubUrl === "string"
                ? { githubUrl: proj.githubUrl }
                : {}),
              ...(Array.isArray(proj.highlights)
                ? { highlights: proj.highlights }
                : {}),
            }))
          : [];

        // Transform social links if they exist
        const transformedSocialLinks = Array.isArray(parsedProfile.socialLinks)
          ? parsedProfile.socialLinks
              .filter(
                (link) =>
                  typeof link.platform === "string" &&
                  typeof link.url === "string",
              )
              .map((link) => ({
                platform: link.platform as string,
                url: link.url as string,
              }))
          : undefined;

        // Create the profile with transformed data
        await createProfile({
          name: parsedProfile.name || "New User",
          email: parsedProfile.email || "user@example.com",
          education: transformedEducation,
          workExperience: transformedWorkExperience,
          projects: transformedProjects,
          skills: Array.isArray(parsedProfile.skills)
            ? parsedProfile.skills
            : [],
          userId: user?.id || "",
          // Optional fields - only include if they're valid strings
          ...(typeof parsedProfile.phone === "string"
            ? { phone: parsedProfile.phone }
            : {}),
          ...(typeof parsedProfile.location === "string"
            ? { location: parsedProfile.location }
            : {}),
          ...(typeof parsedProfile.profilePictureUrl === "string"
            ? { profilePictureUrl: parsedProfile.profilePictureUrl }
            : {}),
          ...(transformedSocialLinks
            ? { socialLinks: transformedSocialLinks }
            : {}),
        });

        toast.success("Resume processed and profile created successfully!");
      } catch (error) {
        console.error("Error creating profile:", error);
        toast.error("Error creating profile. Please try again.");
      }
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
      console.log("userId:", user);
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
        userId: user?.id || "",
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
        <Label>Upload Resume (PDF)</Label>
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
