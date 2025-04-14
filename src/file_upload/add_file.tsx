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
import {
  FileUploadProgress,
  type FileUploadStage,
} from "./components/FileUploadProgress";

const MAX_FILE_SIZE = 5;

export default function AddFile() {
  const [file, setFile] = useState<File | null>(null);
  const [fileSize, setFileSize] = useState(0);
  const [currentStage, setCurrentStage] = useState<FileUploadStage>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFile = useMutation(api.files.saveFile);
  const parseResume = useAction(api.openai.parseResume);
  const createProfile = useMutation(api.profiles.createProfile);
  const updateProfile = useMutation(api.profiles.updateProfile);
  const { isWorkerInitialized, loadDocument, extractText } = useMupdf();
  const { isAuthenticated, user } = useAuth();
  const { redirect } = useRouter();

  const userProfile = useQuery(api.profiles.getProfileByUserId, {
    userId: user?.id || "",
  });

  if (!isAuthenticated || !user) {
    redirect("login");
  }

  const isProcessing = !["idle", "completed", "failed"].includes(currentStage);

  const onDrop = (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      const fileSizeMB = selectedFile.size / 1024 / 1024;
      if (fileSizeMB > MAX_FILE_SIZE) {
        toast.error(`File size must be less than ${MAX_FILE_SIZE}MB`);
        return;
      }
      setFileSize(fileSizeMB);
      setFile(selectedFile);
      setCurrentStage("idle");
      setErrorMessage(undefined);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    multiple: false,
    disabled: isProcessing,
  });

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.readAsArrayBuffer(file);
    });

  const handleUpload = async (fileToUpload: File): Promise<string> => {
    setCurrentStage("uploading");
    setErrorMessage(undefined);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": fileToUpload.type },
        body: fileToUpload,
      });

      if (!result.ok) {
        throw new Error(`Upload failed: ${result.statusText}`);
      }

      const { storageId } = await result.json();

      await saveFile({
        storageId,
        fileName: fileToUpload.name,
        fileType: fileToUpload.type,
        fileSize: fileToUpload.size,
        userId: user?.id || "",
      });
      toast.success("File uploaded successfully!");
      return storageId;
    } catch (error) {
      console.error("Upload error:", error);
      const message = "Failed to upload file. Please try again.";
      setErrorMessage(message);
      setCurrentStage("failed");
      toast.error(message);
      throw error;
    }
  };

  const handleProcessAndProfileUpdate = async () => {
    if (!file || !user?.id) {
      toast.error("No file selected or user not authenticated.");
      return;
    }

    setCurrentStage("idle");
    setErrorMessage(undefined);

    try {
      await handleUpload(file);

      setCurrentStage("extracting");
      const buffer = await readFileAsArrayBuffer(file);
      await loadDocument(buffer);
      const text = await extractText();

      setCurrentStage("parsing");
      const parsedProfile = await parseResume({ resumeText: text });
      console.log("Parsed Profile:", parsedProfile);

      setCurrentStage("updating_profile");
      if (!user.id) {
        throw new Error("User ID missing.");
      }

      const profileData = {
        name: parsedProfile.name || "User Name",
        email: parsedProfile.email || "user@example.com",
        ...(parsedProfile.phone ? { phone: String(parsedProfile.phone) } : {}),
        ...(parsedProfile.location
          ? { location: String(parsedProfile.location) }
          : {}),

        education: Array.isArray(parsedProfile.education)
          ? parsedProfile.education
              .filter(Boolean)
              .filter(
                (edu) =>
                  edu.institution && edu.degree && edu.field && edu.startDate,
              )
              .map((edu) => ({
                institution: String(edu.institution),
                degree: String(edu.degree),
                field: String(edu.field),
                startDate: String(edu.startDate),
                endDate: edu.endDate ? String(edu.endDate) : undefined,
                gpa: edu.gpa != null ? Number(edu.gpa) : undefined,
                description: edu.description
                  ? String(edu.description)
                  : undefined,
                location: edu.location ? String(edu.location) : undefined,
              }))
          : [],

        workExperience: Array.isArray(parsedProfile.workExperience)
          ? parsedProfile.workExperience
              .filter(Boolean)
              .filter((work) => work.company && work.position && work.startDate)
              .map((work) => ({
                company: String(work.company),
                position: String(work.position),
                startDate: String(work.startDate),
                current: work.current === true,
                description: Array.isArray(work.description)
                  ? work.description.map(String)
                  : [],
                endDate: work.endDate ? String(work.endDate) : undefined,
                location: work.location ? String(work.location) : undefined,
                technologies: Array.isArray(work.technologies)
                  ? work.technologies.map(String)
                  : [],
              }))
          : [],

        projects: Array.isArray(parsedProfile.projects)
          ? parsedProfile.projects
              .filter(Boolean)
              .filter((proj) => proj.name)
              .map((proj) => ({
                name: String(proj.name),
                description: Array.isArray(proj.description)
                  ? proj.description.map(String)
                  : [],
                technologies: Array.isArray(proj.technologies)
                  ? proj.technologies.map(String)
                  : [],
                startDate: proj.startDate ? String(proj.startDate) : undefined,
                endDate: proj.endDate ? String(proj.endDate) : undefined,
                link: proj.link ? String(proj.link) : undefined,
                githubUrl: proj.githubUrl ? String(proj.githubUrl) : undefined,
                highlights: Array.isArray(proj.highlights)
                  ? proj.highlights.map(String)
                  : [],
              }))
          : [],

        skills: Array.isArray(parsedProfile.skills)
          ? parsedProfile.skills.map(String)
          : [],

        socialLinks: Array.isArray(parsedProfile.socialLinks)
          ? parsedProfile.socialLinks
              .filter(Boolean)
              .filter((link) => link.platform && link.url)
              .map((link) => ({
                platform: String(link.platform),
                url: String(link.url),
              }))
          : [],

        userId: user.id,
      };

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

      setCurrentStage("completed");
      setFile(null);
      setFileSize(0);
    } catch (error) {
      console.error("Processing error:", error);
      if (currentStage !== "failed") {
        let stageErrorMessage =
          "An unexpected error occurred during processing.";
        if (currentStage === "extracting")
          stageErrorMessage = "Failed to extract text from PDF.";
        else if (currentStage === "parsing")
          stageErrorMessage = "Failed to parse resume data.";
        else if (currentStage === "updating_profile")
          stageErrorMessage = "Failed to update profile.";

        setErrorMessage(stageErrorMessage);
        setCurrentStage("failed");
        toast.error(stageErrorMessage);
      }
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
          isProcessing && "opacity-50 cursor-not-allowed",
        )}
      >
        <input {...getInputProps()} disabled={isProcessing} />
        <Label>Upload Resume (PDF, Max {MAX_FILE_SIZE}MB)</Label>
        <div className="text-sm text-muted-foreground text-center">
          {isDragActive ? (
            <p>Drop the file here</p>
          ) : (
            <p>Drag and drop a file here, or click to select</p>
          )}
        </div>
      </div>

      {file && !isProcessing && currentStage !== "completed" && (
        <div className="text-sm text-gray-600">
          Selected file: {file.name} ({fileSize.toFixed(2)} MB)
        </div>
      )}

      {currentStage !== "idle" && (
        <FileUploadProgress currentStage={currentStage} error={errorMessage} />
      )}

      <Button
        onClick={handleProcessAndProfileUpdate}
        disabled={!file || !isWorkerInitialized || isProcessing}
        className="w-full"
      >
        {isProcessing ? "Processing..." : "Process Resume & Update Profile"}
      </Button>
    </div>
  );
}
