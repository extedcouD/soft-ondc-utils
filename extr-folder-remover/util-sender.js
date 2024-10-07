const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

// Function to execute a shell script and capture the response
function executeShellScript(scriptPath) {
  return new Promise((resolve, reject) => {
    exec(`sh ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        reject(`Error executing ${scriptPath}: ${stderr}`);
      } else {
        resolve(stdout);
      }
    });
  });
}

// Function to iterate over a folder, execute .sh files, and track responses
async function processShellScripts(directoryPath, outputFilePath) {
  const responseTracker = {};

  // Read all files in the directory
  const files = fs.readdirSync(directoryPath);

  // Filter for .sh files
  const shellFiles = files.filter((file) => path.extname(file) === ".sh");

  // Iterate through .sh files and execute them
  for (const file of shellFiles) {
    const scriptPath = path.join(directoryPath, file);

    try {
      const response = await executeShellScript(scriptPath);
      responseTracker[file] = { success: true, response: JSON.parse(response) };
    } catch (error) {
      responseTracker[file] = { success: false, error: error };
    }
  }

  // Write all responses to a JSON file
  fs.writeFileSync(outputFilePath, JSON.stringify(responseTracker, null, 2));
  console.log(`All responses written to ${outputFilePath}`);
}

// Example usage:
const folderPath =
  "/Users/rudranshsinghal/ondc/utils/soft-ondc-utils/extr-folder-remover/payload"; // Specify your folder containing .sh files
const outputFilePath = "./responses.json"; // File to store the responses

processShellScripts(folderPath, outputFilePath);
