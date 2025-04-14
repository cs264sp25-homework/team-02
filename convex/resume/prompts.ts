import { JobType } from "../jobs";
import { ProfileType } from "../profiles";
import { ImproveResumeActionType } from "./schema";

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
  The current field in the work experience and project experience is a boolean field. It is true if the experience is currently happening and false otherwise.
  If the current field is true, then the end date field should be "Present".
  The current field should be populated as false if the end date is present.
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

export function getPromptForImproveResumeLine(
  line: string,
  action: ImproveResumeActionType,
) {
  let basePrompt = `You are a resume writer. You are given a line of LaTeX code and you need to improve it.
  The line is in the following format:
  <line>
  ${line.trim()}
  </line>

  Do not change the latex code, only improve the content.
  Only output the improved line, do not include any other text.

  Your job is defined below:
  `;
  if (action === "shorten") {
    basePrompt += `
    Shorten the line to fit in one line on a letter sized paper. Only keep the most important details.
    `;
  }
  if (action === "lengthen") {
    basePrompt += `
    Lengthen the line to make it longer. You can add more details to the line such as using more verbs and adjectives.
    Do not add any new information, only add more details to the line.
    It can be longer than one line on a letter sized paper.
    `;
  }
  if (action === "professional") {
    basePrompt += `
    Make the line more professional. Use more formal language and avoid using contractions.
    `;
  }
  if (action === "technical") {
    basePrompt += `
    Add more technical details to the line. Use more technical language to sound more technical.
    `;
  }
  return basePrompt;
}
