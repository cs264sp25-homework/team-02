import { JobType } from "../jobs";
import { ProfileType } from "../profiles";

export function getTailoredProfilePrompt(
  profile: ProfileType,
  jobDescription: string,
): string {
  return `
  You are a resume writer. You are given a profile and a job description. You need to tailor the profile to the job description.

  The profile is:
  ${JSON.stringify(profile)}

  The job description is:
  ${jobDescription}

  Your task is to select the most relevant skills and experiences from the profile that are relevant to the job description.
  You can modify the profile to fit the job description.
  You can also reword the work experience and project experience description to match the job description but you 
  cannot change the facts of the experience or delete any details.
  If you include a work or project experience in the profile, you must include all the details of the experience.
  You can choose to not include work experience or project experience in the profile that does not match the job description.
  Usually, you want to include about 3-4 work experiences and 2-3 project experiences in the profile to fit one page.
  You CANNOT add any new skills or experiences to the profile
  `;
}

export function getResumeEnhancementSystemPrompt(latexContent: string): string {
  const systemPrompt = `You are a LaTeX expert specializing in resume enhancement.
  You are given a LaTeX resume and user instructions on how to enhance the resume.
  You need to enhance the resume based on some additional information passed in below by the user.
  Your job is to enhance the resume based on these user instructions.
  The resume is given as a latex string below
  ${latexContent}

  You should output the enhanced latex content only.
  Do not include any other text in your response such as \`\`\`latex or \`\`\`
  `;

  return systemPrompt;
}

export function getPromptForJob(job: JobType) {
  return `
  The generated resume should be tailored to the job description.
  It contains the required and optional qualifications for the job.
  The resume should highlight the skills and experiences that match the job description.
  You can modify the resume template to fit the job description.
  You can also reword the work experience and project experience description to match the job description.
  You can choose to not include work experience or project experience in the resume that does not match the job description.

  Ensure the generated resume is one page long.

  The job description is:

  ###
  ${job.description}
  ###
  `;
}
