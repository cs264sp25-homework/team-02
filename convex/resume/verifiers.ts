import { ProfileType } from "../profiles";

export function cleanTailoredProfile(
  tailoredProfile: ProfileType,
  userProfile: ProfileType,
) {
  // ensure that the tailored profile work experience is a subset of the user profile work experience
  const userWorkExperience = userProfile.workExperience;
  // delete work experience that do not match the user profile work experience
  tailoredProfile.workExperience = tailoredProfile.workExperience
    .filter((workExperience) =>
      userWorkExperience.some(
        (userWorkExperience) =>
          userWorkExperience.company === workExperience.company &&
          userWorkExperience.position === workExperience.position &&
          userWorkExperience.startDate === workExperience.startDate &&
          userWorkExperience.endDate === workExperience.endDate,
      ),
    )
    .sort(
      (a, b) =>
        // reverse sort by start date
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    );
  // delete education that do not match the user profile education
  const userEducation = userProfile.education;
  tailoredProfile.education = tailoredProfile.education.filter((education) =>
    userEducation.some(
      (userEducation) =>
        userEducation.institution === education.institution &&
        userEducation.degree === education.degree &&
        userEducation.endDate === education.endDate,
    ),
  );
  // delete projects that do not match the user profile projects
  const userProjects = userProfile.projects;
  tailoredProfile.projects = tailoredProfile.projects.filter((project) =>
    userProjects.some((userProject) => userProject.name === project.name),
  );
  return tailoredProfile;
}
