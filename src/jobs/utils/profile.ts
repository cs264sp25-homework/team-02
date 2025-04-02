import { ProfileType } from "../../../convex/profiles";

export const formatProfileBackground = (
  profile: ProfileType | null | undefined,
) => {
  if (!profile) return "";

  const sections = [];

  // Education
  if (profile.education?.length > 0) {
    sections.push("Education:");
    profile.education.forEach((edu) => {
      sections.push(`- ${edu.degree} in ${edu.field} from ${edu.institution}`);
      if (edu.description) sections.push(`  ${edu.description}`);
    });
  }

  // Work Experience
  if (profile.workExperience?.length > 0) {
    sections.push("\nWork Experience:");
    profile.workExperience.forEach((work) => {
      sections.push(`- ${work.position} at ${work.company}`);
      if (work.description?.length > 0) {
        work.description.forEach((desc) => {
          sections.push(`  ${desc}`);
        });
      }
      if (work.technologies && work.technologies.length > 0) {
        sections.push(`  Technologies: ${work.technologies.join(", ")}`);
      }
    });
  }

  // Projects
  if (profile.projects?.length > 0) {
    sections.push("\nProjects:");
    profile.projects.forEach((project) => {
      sections.push(`- ${project.name}`);
      if (project.description?.length > 0) {
        project.description.forEach((desc) => {
          sections.push(`  ${desc}`);
        });
      }
      if (project.technologies && project.technologies.length > 0) {
        sections.push(`  Technologies: ${project.technologies.join(", ")}`);
      }
      if (project.highlights && project.highlights.length > 0) {
        sections.push(`  Highlights: ${project.highlights.join(", ")}`);
      }
    });
  }

  // Skills
  if (profile.skills?.length > 0) {
    sections.push("\nSkills:");
    sections.push(profile.skills.join(", "));
  }

  return sections.join("\n");
};
