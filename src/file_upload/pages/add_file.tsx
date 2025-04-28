import { useState } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/core/components/button";
import { Label } from "@/core/components/label";
import { useDropzone } from "react-dropzone";
import { cn } from "@/core/lib/utils";
import { useMupdf } from "../hooks/usePdfWorker";
import { useAuth } from "@/linkedin/hooks/useAuth";
import { useRouter } from "@/core/hooks/use-router";
import {
  FileUploadProgress,
  type FileUploadStage,
} from "../components/FileUploadProgress";

const MAX_FILE_SIZE = 5;

export default function AddFile() {
  const [files, setFiles] = useState<File[]>([]);
  const [fileDetails, setFileDetails] = useState<{
    [key: string]: { size: number; uploaded: boolean };
  }>({});
  const [currentStage, setCurrentStage] = useState<FileUploadStage>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );
  const [processingCount, setProcessingCount] = useState({
    current: 0,
    total: 0,
  });

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
    if (acceptedFiles.length === 0) return;

    const validFiles: File[] = [];
    const newFileDetails: {
      [key: string]: { size: number; uploaded: boolean };
    } = { ...fileDetails };

    acceptedFiles.forEach((file) => {
      const fileSizeMB = file.size / 1024 / 1024;
      if (fileSizeMB > MAX_FILE_SIZE) {
        toast.error(
          `File ${file.name} exceeds the ${MAX_FILE_SIZE}MB limit and was not added`,
        );
        return;
      }
      validFiles.push(file);
      newFileDetails[file.name] = {
        size: fileSizeMB,
        uploaded: false,
      };
    });

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
      setFileDetails(newFileDetails);
      setCurrentStage("idle");
      setErrorMessage(undefined);
      toast.success(`${validFiles.length} file(s) added successfully`);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 10,
    multiple: true,
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

      setFileDetails((prev) => ({
        ...prev,
        [fileToUpload.name]: {
          ...prev[fileToUpload.name],
          uploaded: true,
        },
      }));

      return storageId;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const processFile = async (file: File): Promise<string> => {
    setProcessingCount((prev) => ({ ...prev, current: prev.current + 1 }));

    try {
      await handleUpload(file);
      const buffer = await readFileAsArrayBuffer(file);
      await loadDocument(buffer);
      const text = await extractText();
      return text;
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      throw error;
    }
  };

  const handleProcessAndProfileUpdate = async () => {
    if (files.length === 0 || !user?.id) {
      toast.error("No files selected or user not authenticated.");
      return;
    }

    setCurrentStage("uploading");
    setErrorMessage(undefined);
    setProcessingCount({ current: 0, total: files.length });

    try {
      const allTexts: string[] = [];

      // First upload all files and extract text
      setCurrentStage("extracting");
      for (const file of files) {
        try {
          const text = await processFile(file);
          allTexts.push(text);
        } catch (error) {
          console.error(`Failed to process ${file.name}:`, error);
          toast.error(`Failed to process ${file.name}`);
        }
      }

      if (allTexts.length === 0) {
        throw new Error("No files were successfully processed");
      }

      // Then parse all resume texts together
      setCurrentStage("parsing");

      // Combine all resume texts with clear separators
      const combinedResumeText = allTexts
        .map((text, index) => `===== RESUME ${index + 1} =====\n\n${text}`)
        .join("\n\n");

      // Include existing profile data if available
      let existingProfileData = "";
      if (userProfile) {
        // Create a simplified version of the profile without system fields
        const profileForAI = {
          name: userProfile.name,
          email: userProfile.email,
          phone: userProfile.phone,
          location: userProfile.location,
          education: userProfile.education,
          workExperience: userProfile.workExperience,
          projects: userProfile.projects,
          skills: userProfile.skills,
          socialLinks: userProfile.socialLinks,
        };
        existingProfileData = JSON.stringify(profileForAI);
      }

      const parsedProfile = await parseResume({
        resumeText: combinedResumeText,
        existingProfile: existingProfileData,
      });
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
        toast.success("Resumes processed and profile updated successfully!");
      } else {
        await createProfile({
          ...profileData,
          userId: user.id,
        });
        toast.success("Resumes processed and profile created successfully!");
      }

      setCurrentStage("completed");
      setFiles([]);
      setFileDetails({});
      setProcessingCount({ current: 0, total: 0 });
    } catch (error) {
      console.error("Processing error:", error);
      if (currentStage !== "failed") {
        let stageErrorMessage =
          "An unexpected error occurred during processing.";
        if (currentStage === "extracting")
          stageErrorMessage = "Failed to extract text from PDFs.";
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

  const removeFile = (fileName: string) => {
    setFiles((prev) => prev.filter((file) => file.name !== fileName));
    setFileDetails((prev) => {
      const newDetails = { ...prev };
      delete newDetails[fileName];
      return newDetails;
    });
    toast.info(`Removed ${fileName}`);
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
        <Label>Upload Resumes (PDF, Max {MAX_FILE_SIZE}MB each)</Label>
        <div className="text-sm text-muted-foreground text-center">
          {isDragActive ? (
            <p>Drop the files here</p>
          ) : (
            <p>Drag and drop files here, or click to select multiple files</p>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">
            Selected files ({files.length}):
          </div>
          <ul className="text-sm space-y-1">
            {files.map((file) => (
              <li
                key={file.name}
                className="flex justify-between items-center bg-gray-50 p-2 rounded"
              >
                <span>
                  {file.name} ({fileDetails[file.name]?.size.toFixed(2) || "0"}{" "}
                  MB)
                </span>
                {!isProcessing && (
                  <button
                    onClick={() => removeFile(file.name)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {currentStage !== "idle" && (
        <div>
          <FileUploadProgress
            currentStage={currentStage}
            error={errorMessage}
            processingInfo={processingCount}
          />
          {isProcessing && processingCount.total > 0 && (
            <div className="text-sm text-center mt-2">
              Processing file {processingCount.current} of{" "}
              {processingCount.total}
            </div>
          )}
        </div>
      )}

      <Button
        onClick={handleProcessAndProfileUpdate}
        disabled={files.length === 0 || !isWorkerInitialized || isProcessing}
        className="w-full"
      >
        {isProcessing
          ? "Processing..."
          : `Process ${files.length} Resume(s) & Enhance Profile`}
      </Button>
    </div>
  );
}
