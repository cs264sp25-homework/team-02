import { ProfileType } from "../profiles";

export function generateJakesResume(profile: ProfileType): string {
  // Helper function to escape LaTeX special characters
  const escapeLatex = (text: string): string => {
    return text.replace(/[&%$#_{}~^\\]/g, "\\$&");
  };

  // Helper function to format dates
  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  // Helper function to format date range
  const formatDateRange = (
    startDate: string,
    endDate?: string,
    current?: boolean,
  ): string => {
    const start = formatDate(startDate);
    if (start.includes("Invalid Date")) return "";
    if (current) return `${start} -- Present`;
    if (endDate) {
      const end = formatDate(endDate);
      if (end.includes("Invalid Date")) return "";
      return `${start} -- ${end}`;
    }
    return start;
  };

  // Helper function to format social links
  const formatSocialLinks = (
    links?: { platform: string; url: string }[],
  ): string => {
    if (!links || links.length === 0) return "";
    return links
      .map((link) => `\\href{${link.url}}{${link.platform}}`)
      .join(" $|$ ");
  };

  // Helper function to format education
  const formatEducation = (education: ProfileType["education"]): string => {
    return education
      .map(
        (edu) => `
    \\resumeSubheading
      {${escapeLatex(edu.institution)}}{${edu.location ? escapeLatex(edu.location) : ""}}
      {${escapeLatex(edu.degree)}${edu.field ? `, ${escapeLatex(edu.field)}` : ""}}{${formatDateRange(edu.startDate, edu.endDate)}}
      ${edu.gpa ? `\\resumeItem{GPA: ${edu.gpa}}` : ""}
      ${edu.description ? `\\resumeItem{${escapeLatex(edu.description)}}` : ""}
    `,
      )
      .join("\n");
  };

  // Helper function to format work experience
  const formatWorkExperience = (
    workExperience: ProfileType["workExperience"],
  ): string => {
    return workExperience
      .map(
        (work) => `
    \\resumeSubheading
      {${escapeLatex(work.position)}}{${formatDateRange(work.startDate, work.endDate, work.current)}}
      {${escapeLatex(work.company)}}{${work.location ? escapeLatex(work.location) : ""}}
      \\resumeItemListStart
        ${work.description.map((desc) => `\\resumeItem{${escapeLatex(desc)}}`).join("\n        ")}
        ${
          work.technologies && work.technologies.length > 0
            ? `\\resumeItem{Technologies: ${work.technologies.map((tech) => escapeLatex(tech)).join(", ")}}`
            : ""
        }
      \\resumeItemListEnd
    `,
      )
      .join("\n");
  };

  // Helper function to format projects
  const formatProjects = (projects: ProfileType["projects"]): string => {
    return projects
      .map(
        (proj) => `
    \\resumeProjectHeading
      {\\textbf{${escapeLatex(proj.name)}} $|$ \\emph{${proj.technologies.map((tech) => escapeLatex(tech)).join(", ")}}}{${formatDateRange(proj.startDate || "", proj.endDate)}}
      \\resumeItemListStart
        ${proj.description.map((desc) => `\\resumeItem{${escapeLatex(desc)}}`).join("\n        ")}
        ${
          proj.highlights && proj.highlights.length > 0
            ? proj.highlights
                .map((highlight) => `\\resumeItem{${escapeLatex(highlight)}}`)
                .join("\n        ")
            : ""
        }
        ${proj.link ? `\\resumeItem{Link: \\href{${proj.link}}{${escapeLatex(proj.link)}}}` : ""}
        ${proj.githubUrl ? `\\resumeItem{GitHub: \\href{${proj.githubUrl}}{${escapeLatex(proj.githubUrl)}}}` : ""}
      \\resumeItemListEnd
    `,
      )
      .join("\n");
  };

  // Helper function to format skills
  const formatSkills = (skills: string[]): string => {
    return skills.map((skill) => escapeLatex(skill)).join(", ");
  };

  return `%-------------------------
% Resume in Latex
% Author : Jake Gutierrez
% Based off of: https://github.com/sb2nov/resume
% License : MIT
%------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}


%----------FONT OPTIONS----------
% sans-serif
% \\usepackage[sfdefault]{FiraSans}
% \\usepackage[sfdefault]{roboto}
% \\usepackage[sfdefault]{noto-sans}
% \\usepackage[default]{sourcesanspro}

% serif
% \\usepackage{CormorantGaramond}
% \\usepackage{charter}


\\pagestyle{fancy}
\\fancyhf{} % clear all header and footer fields
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins

\\addtolength{\\oddsidemargin}{-0.6in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1.19in}
\\addtolength{\\topmargin}{-.7in}
\\addtolength{\\textheight}{1.4in}
\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

% Ensure that generate pdf is machine readable/ATS parsable
\\pdfgentounicode=1

%-------------------------
% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubSubheading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\textit{\\small#1} & \\textit{\\small #2} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}

\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%


\\begin{document}

%----------HEADING----------
\\begin{center}
    \\textbf{\\Huge \\scshape ${escapeLatex(profile.name)} \\\\ \\vspace{1pt}}
    \\small ${profile.phone ? `${escapeLatex(profile.phone)} $|$ ` : ""} 
    \\href{mailto:${profile.email}}{\\underline{${escapeLatex(profile.email)}}} $|$ 
    ${formatSocialLinks(profile.socialLinks)}
\\end{center}


%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart
    ${formatEducation(profile.education)}
  \\resumeSubHeadingListEnd


%-----------EXPERIENCE-----------
\\section{Experience}
  \\resumeSubHeadingListStart
    ${formatWorkExperience(profile.workExperience)}
  \\resumeSubHeadingListEnd


%-----------PROJECTS-----------
\\section{Projects}
  \\resumeSubHeadingListStart
    ${formatProjects(profile.projects)}
  \\resumeSubHeadingListEnd


%-----------PROGRAMMING SKILLS-----------
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Skills}{: ${formatSkills(profile.skills)}
}}}
 \\end{itemize}


%-------------------------------------------
\\end{document}`;
}
