import { action } from "./_generated/server";
import * as cheerio from "cheerio";
import { v } from "convex/values";

export const scrapeJob = action({
  args: {
    postingUrl: v.string(),
    applicationUrl: v.string(),
  },
  handler: async (_ctx, args) => {
    const scrapedJobPosting = await scrapeJobPosting(args.postingUrl);
    const scrapedJobApplication = await scrapeJobApplication(
      args.applicationUrl,
    );

    return {
      title: scrapedJobPosting.title,
      description: scrapedJobPosting.description,
      questions: scrapedJobApplication.questions,
    };
  },
});

const scrapeJobPosting = async (postingUrl: string) => {
  const response = await fetch(postingUrl);
  const html = await response.text();
  const $ = cheerio.load(html);

  const jobRequirements = scrapeJobRequirements(html);

  return {
    title: $("title").text().trim() || "No job title found",
    description: jobRequirements,
    html: html, // Keep this for debugging
  };
};

const scrapeJobRequirements = (html: string) => {
  const $ = cheerio.load(html);

  // Find the div containing "Requirements"
  const requirementsDiv = $("div").filter(function () {
    return $(this).text().toLowerCase() === "requirements";
  });

  // Get all requirements until the next section (Responsibilities)
  const requirementsList = requirementsDiv
    .parent() // Go to parent container
    .find("ul") // Find the ul within this section
    .first() // Take only the first ul (requirements section)
    .find("li"); // Get all li elements

  // Extract text from <li> items
  const requirementsText = requirementsList
    .map((_, el) => $(el).text().trim())
    .get();

  // Join the list items into a paragraph
  const paragraph =
    requirementsText.length > 0
      ? requirementsText.join(" ")
      : "No requirements found";

  return paragraph;
};

const scrapeJobApplication = async (applicationUrl: string) => {
  const response = await fetch(applicationUrl);
  const html = await response.text();

  const applicationQuestions = scrapeJobApplicationQuestions(html);

  return {
    questions: applicationQuestions,
  };
};

const scrapeJobApplicationQuestions = (html: string) => {
  const $ = cheerio.load(html);

  const questions = $("div.text").filter(function () {
    const text = $(this).text().toLowerCase();
    return text.includes("max") && text.includes("words");
  });

  return questions.toArray().map((question) => $(question).text().trim());
};
