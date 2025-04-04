import { ProfileType } from "convex/profiles";

const TailoredProfileInsights = ({
  tailoredProfile,
}: {
  tailoredProfile: ProfileType;
}) => {
  // Extract selected work and project experiences
  const workExperiences = tailoredProfile.workExperience || [];
  const projectExperiences = tailoredProfile.projects || [];

  return (
    <div className="mt-2 pl-4 border-l-2 border-blue-200 text-left">
      {/* Work Experiences */}
      <div className="text-sm">
        <h4 className="font-medium text-blue-700 mb-1">
          Relevant Work Experiences:
        </h4>
        {workExperiences.length > 0 ? (
          <ul className="list-disc pl-4 space-y-1">
            {workExperiences.map((exp, index) => (
              <li key={index} className="text-gray-700">
                {exp.company} - {exp.position}
                {exp.startDate && (
                  <span className="text-gray-500 text-xs ml-1">
                    ({exp.startDate} - {exp.endDate || "Present"})
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No work experiences selected</p>
        )}
      </div>

      {/* Project Experiences */}
      <div className="text-sm mt-3">
        <h4 className="font-medium text-blue-700 mb-1">
          Relevant Project Experiences:
        </h4>
        {projectExperiences.length > 0 ? (
          <ul className="list-disc pl-4 space-y-1">
            {projectExperiences.map((proj, index) => (
              <li key={index} className="text-gray-700">
                {proj.name}
                {proj.startDate && (
                  <span className="text-gray-500 text-xs ml-1">
                    ({proj.startDate} - {proj.endDate || "Present"})
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">
            No project experiences selected
          </p>
        )}
      </div>

      {/* Skills */}
      <div className="text-sm mt-3">
        <h4 className="font-medium text-blue-700 mb-1">Relevant Skills:</h4>
        {tailoredProfile.skills && tailoredProfile.skills.length > 0 ? (
          <p className="text-gray-500 italic">
            {tailoredProfile.skills.join(", ")}
          </p>
        ) : (
          <p className="text-gray-500 italic">No skills selected</p>
        )}
      </div>
    </div>
  );
};

export default TailoredProfileInsights;
