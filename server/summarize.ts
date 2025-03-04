import { spawn } from "child_process";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function summarizeText(text: string, language: string): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log('Starting Python summarizer process...');
    const scriptPath = path.join(__dirname, "summarizer.py");
    console.log('Script path:', scriptPath);

    const pythonProcess = spawn("python3", [
      scriptPath,
      text,
      language
    ]);

    let output = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString();
      console.log('Python output:', data.toString());
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
      console.error('Python error:', data.toString());
    });

    pythonProcess.on("close", (code) => {
      console.log('Python process exited with code:', code);
      if (code !== 0) {
        console.error("Python summarization error:", errorOutput);
        reject(new Error(`Failed to generate summary: ${errorOutput}`));
      } else {
        resolve(output.trim());
      }
    });

    pythonProcess.on("error", (error) => {
      console.error("Failed to start Python process:", error);
      reject(new Error("Failed to start summarization process"));
    });
  });
}