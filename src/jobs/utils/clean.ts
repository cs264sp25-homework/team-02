export function extractQuestions(text: string): string[] {
  try {
    // Split text into lines and trim whitespace
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => !line.includes("Z") && line !== "");

    const reconstructedQuestions = [];
    let currentQuestion = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // If the line starts with a question word or a capital letter, assume it's a new question
      if (
        /^(What|Why|How|When|Where|Who|Which|Do|Does|Is|Are|Can|Could|Would|Should)\b/i.test(
          line,
        ) ||
        /^[A-Z]/.test(line)
      ) {
        // If there's already a question being built, push it to the list
        if (currentQuestion) {
          reconstructedQuestions.push(currentQuestion.trim());
        }
        // Start a new question
        currentQuestion = line;
      } else {
        // Otherwise, continue appending to the current question (likely a broken part of the previous line)
        currentQuestion += " " + line;
      }
    }

    // Add the last accumulated question if any
    if (currentQuestion) {
      reconstructedQuestions.push(currentQuestion.trim());
    }

    return reconstructedQuestions;
  } catch (error) {
    console.error("Error extracting questions:", error);
    return [];
  }
}
