import { useState } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
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
  const updateProfile = useMutation(api.profiles.updateProfile);
  const [fileSize, setFileSize] = useState(0);
  const { isWorkerInitialized, loadDocument, extractText } = useMupdf();
  const { isAuthenticated, user } = useAuth();
  const { redirect } = useRouter();

  const userProfile = useQuery(api.profiles.getProfileByUserId, {
    userId: user?.id || "",
  });

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

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.readAsArrayBuffer(file);
    });

  const handleExtract = async () => {
    handleUpload();
    if (!file) return;

    try {
      setIsProcessing(true);

      const buffer = await readFileAsArrayBuffer(file);

      await loadDocument(buffer);

      const text = await extractText();

      const parsedProfile = await parseResume({ resumeText: text });

      console.log("parsedProfile", parsedProfile);

      try {
        if (!user?.id) {
          toast.error("User ID not available. Cannot create/update profile.");
          return;
        }

        const profileData = {
          name: parsedProfile.name || "New User",
          email: parsedProfile.email || "user@example.com",

          // Education: ensure all required fields are present
          education: Array.isArray(parsedProfile.education)
            ? parsedProfile.education
                .filter(Boolean)
                .filter(
                  (edu) =>
                    // Only include entries with all required fields
                    edu.institution && edu.degree && edu.field && edu.startDate,
                )
                .map((edu) => ({
                  institution: String(edu.institution),
                  degree: String(edu.degree),
                  field: String(edu.field),
                  startDate: String(edu.startDate),
                  // Optional fields
                  ...(edu.endDate ? { endDate: String(edu.endDate) } : {}),
                  ...(edu.gpa !== undefined && edu.gpa !== null
                    ? { gpa: Number(edu.gpa) }
                    : {}),
                  ...(edu.description
                    ? { description: String(edu.description) }
                    : {}),
                  ...(edu.location ? { location: String(edu.location) } : {}),
                }))
            : [],

          // Work Experience: ensure all required fields are present
          workExperience: Array.isArray(parsedProfile.workExperience)
            ? parsedProfile.workExperience
                .filter(Boolean)
                .filter(
                  (work) =>
                    // Only include entries with all required fields
                    work.company && work.position && work.startDate,
                )
                .map((work) => ({
                  company: String(work.company),
                  position: String(work.position),
                  startDate: String(work.startDate),
                  // current is required in schema, so provide default if missing
                  current: work.current === true,
                  // Description is an array of strings, use default if missing
                  description: Array.isArray(work.description)
                    ? work.description
                    : [],
                  // Optional fields
                  ...(work.endDate ? { endDate: String(work.endDate) } : {}),
                  ...(work.location ? { location: String(work.location) } : {}),
                  ...(Array.isArray(work.technologies)
                    ? { technologies: work.technologies }
                    : {}),
                }))
            : [],

          // Projects: ensure all required fields are present
          projects: Array.isArray(parsedProfile.projects)
            ? parsedProfile.projects
                .filter(Boolean)
                .filter((proj) => proj.name)
                .map((proj) => ({
                  name: String(proj.name),
                  // Required arrays with defaults
                  description: Array.isArray(proj.description)
                    ? proj.description
                    : [],
                  technologies: Array.isArray(proj.technologies)
                    ? proj.technologies
                    : [],
                  // Optional fields
                  ...(proj.startDate
                    ? { startDate: String(proj.startDate) }
                    : {}),
                  ...(proj.endDate ? { endDate: String(proj.endDate) } : {}),
                  ...(proj.link ? { link: String(proj.link) } : {}),
                  ...(proj.githubUrl
                    ? { githubUrl: String(proj.githubUrl) }
                    : {}),
                  ...(Array.isArray(proj.highlights)
                    ? { highlights: proj.highlights }
                    : {}),
                }))
            : [],

          // Skills: array of strings
          skills: Array.isArray(parsedProfile.skills)
            ? parsedProfile.skills
            : [],

          // Optional scalar fields
          ...(parsedProfile.phone
            ? { phone: String(parsedProfile.phone) }
            : {}),
          ...(parsedProfile.location
            ? { location: String(parsedProfile.location) }
            : {}),

          // Optional socialLinks array
          ...(Array.isArray(parsedProfile.socialLinks) &&
          parsedProfile.socialLinks.length > 0
            ? {
                socialLinks: parsedProfile.socialLinks
                  .filter(Boolean)
                  .filter((link) => link.platform && link.url)
                  .map((link) => ({
                    platform: String(link.platform),
                    url: String(link.url),
                  })),
              }
            : {}),

          // Required userId
          userId: user.id,
        };

        // Check if profile already exists
        if (userProfile) {
          await updateProfile({
            ...profileData,
            profileId: userProfile._id,
            userId: user.id,
          });
          toast.success("Resume processed and profile updated successfully!");
        } else {
          await createProfile({
            ...profileData,
            userId: user.id,
          });
          toast.success("Resume processed and profile created successfully!");
        }
      } catch (error) {
        console.error("Error processing profile:", error);
        toast.error("Error processing profile. Please try again.");
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
        onClick={handleExtract}
        disabled={!file || !isWorkerInitialized || isProcessing}
        className="w-full"
      >
        {isProcessing ? "Processing Resume..." : "Update Profile"}
      </Button>
    </div>
  );
}
