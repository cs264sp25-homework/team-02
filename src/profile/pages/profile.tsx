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

const ProfilePage = () => {
  const { data: profile, loading: isLoading } = useGetOrCreateProfile();
  const mutation = useMutationProfile(profile?._id);

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
          platform: "website",
          url: (formData.get("website") as string) || "",
        },
        {
          platform: "github",
          url: (formData.get("github") as string) || "",
        },
        {
          platform: "linkedin",
          url: (formData.get("linkedin") as string) || "",
        },
        {
          platform: "twitter",
          url: (formData.get("twitter") as string) || "",
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

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
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

                <div className="grid gap-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    defaultValue={getProfileLink("website")}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="github">GitHub</Label>
                  <Input
                    id="github"
                    name="github"
                    type="url"
                    defaultValue={getProfileLink("github")}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    name="linkedin"
                    type="url"
                    defaultValue={getProfileLink("linkedin")}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    name="twitter"
                    type="url"
                    defaultValue={getProfileLink("twitter")}
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
