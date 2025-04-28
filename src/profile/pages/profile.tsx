import { Button } from "@/core/components/button";
import { Input } from "@/core/components/input";
import { Label } from "@/core/components/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/core/components/card";
import { Skeleton } from "@/core/components/skeleton";
import { useGetOrCreateProfile } from "../hooks/use-get-or-create-profile";
import { useMutationProfile } from "../hooks/use-mutation-profile";
import { toast } from "sonner";
import { Education } from "../components/Education";
import { Experience } from "../components/Experience";
import { Projects } from "../components/Projects";
import { Skills } from "../components/Skills";
import { ProfileUpdateType } from "convex/profiles";
import { useRouter } from "@/core/hooks/use-router";
import { useAuth } from "@/linkedin/hooks/useAuth";
import { useEffect, useState } from "react";
import { FileUpIcon, ArrowRightIcon, TrashIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/components/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/core/components/alert-dialog";

const ProfilePage = () => {
  const { isAuthenticated, user } = useAuth();
  const { redirect } = useRouter();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  if (!isAuthenticated) {
    redirect("login");
  }

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#skills") {
      const el = document.getElementById("skills");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, []);

  const { data: profile, loading: isLoading } = useGetOrCreateProfile(user!.id);
  const mutation = useMutationProfile(profile?._id, user!.id);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;

    const formData = new FormData(e.currentTarget);
    const update: ProfileUpdateType = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: (formData.get("phone") as string) || undefined,
      location: (formData.get("location") as string) || undefined,
      socialLinks: [
        {
          platform: "Website",
          url: (formData.get("Website") as string) || "",
        },
        {
          platform: "GitHub",
          url: (formData.get("GitHub") as string) || "",
        },
        {
          platform: "LinkedIn",
          url: (formData.get("LinkedIn") as string) || "",
        },
      ].filter((link) => link.url),
    };

    const success = await mutation.edit(update);
    if (success) {
      toast.success("Profile updated successfully");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const getProfileLink = (platform: string) => {
    return profile?.socialLinks?.find((link) => link.platform === platform)
      ?.url;
  };

  const handleClearProfile = async () => {
    await mutation.clearNonRequiredFields();
    setClearDialogOpen(false);
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Floating Resume Upload Button */}
      <div className="fixed right-6 bottom-10 z-10">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              className="rounded-full w-14 h-14 flex items-center justify-center bg-black hover:bg-gray-800 text-white animate-[glow_2s_ease-in-out_infinite]"
              size="icon"
            >
              <FileUpIcon className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-xl">
                Quick Profile Update
              </DialogTitle>
              <DialogDescription className="text-center">
                Enhance your profile with resume upload
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Have a resume? You can quickly update your entire profile by
                uploading it. We will extract and merge the information
                automatically, saving you time.
              </p>
              <div className="flex justify-center">
                <Button
                  onClick={() => redirect("add_file")}
                  className="gap-2 bg-black hover:bg-gray-800 text-white"
                >
                  <FileUpIcon className="h-4 w-4" />
                  Go to Resume Upload
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Clear Profile Alert Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset your professional data, removing:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Education history</li>
                <li>Work experience</li>
                <li>Projects</li>
                <li>Skills</li>
              </ul>
              <p className="mt-2">
                Your personal information (name, email, phone, location, and
                social links) will be preserved.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearProfile}
              className="bg-red-500 hover:bg-red-600"
            >
              Reset Profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Page Header with Clear Button */}
      <div className="flex justify-end mb-6">
        <Button
          variant="outline"
          onClick={() => setClearDialogOpen(true)}
          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 gap-2"
        >
          <TrashIcon className="h-4 w-4" />
          Reset Profile
        </Button>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader className="relative text-center pb-8">
            <div>
              <CardTitle className="text-xl font-bold">Personal Info</CardTitle>
              <CardDescription className="mt-2">
                Your personal information
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={profile?.name}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={profile?.email}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={profile?.phone}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    defaultValue={profile?.location}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="Website">Website</Label>
                  <Input
                    id="Website"
                    name="Website"
                    type="url"
                    defaultValue={getProfileLink("Website")}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="LinkedIn">LinkedIn</Label>
                  <Input
                    id="LinkedIn"
                    name="LinkedIn"
                    type="url"
                    defaultValue={getProfileLink("LinkedIn")}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="GitHub">GitHub</Label>
                  <Input
                    id="GitHub"
                    name="GitHub"
                    type="url"
                    defaultValue={getProfileLink("GitHub")}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {profile && <Education profile={profile} onUpdate={mutation.edit} />}
        {profile && <Experience profile={profile} onUpdate={mutation.edit} />}
        {profile && <Projects profile={profile} onUpdate={mutation.edit} />}
        {profile && <Skills profile={profile} onUpdate={mutation.edit} />}
      </div>
    </div>
  );
};

export default ProfilePage;
