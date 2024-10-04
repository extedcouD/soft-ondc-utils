const inquirer = require("inquirer");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const url = "http://localhost:3000/api/validate/fis";

const templatePayload = {
  domain: "ONDC:FIS14",
  version: "2.0.0",
  flow: "",
  bap_id: "BUYER_APP_SUBSCRIBER_ID",
  bpp_id: "SELLER_APP_SUBSCRIBER_ID",
  payload: {},
};

function appendToFile(filePath, text) {
  // Ensure directory exists or create it
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Append text to the file (creates the file if it doesn't exist)
  fs.writeFile(filePath, text + "\n", (err) => {
    if (err) {
      console.error("Error appending to file:", err);
    } else {
      console.log("Text successfully added to file.");
    }
  });
}

// Function to fetch repository files from GitHub API
async function fetchGitHubFiles(owner, repo, branch, folderPath) {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${folderPath}?ref=${branch}`;

  try {
    const response = await axios.get(apiUrl);
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching files from GitHub:",
      error.response ? error.response.data.message : error.message
    );
    return [];
  }
}

// Function to get the file content from GitHub raw URL
async function fetchFileContentRaw(owner, repo, branch, filePath) {
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
  try {
    const response = await axios.get(rawUrl);
    return response.data;
  } catch (error) {
    console.error("Error fetching file from raw URL:", error);
    return null;
  }
}

// Helper to extract necessary details from the GitHub URL
function parseGitHubUrl(url) {
  const match = url.match(
    /https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)\/(.+)/
  );
  if (match) {
    const [, owner, repo, branch, folderPath] = match;
    return { owner, repo, branch, folderPath };
  }
  return null;
}

// Recursive function to explore files and directories
async function exploreGitHubFolder(owner, repo, branch, folderPath, flow = "") {
  const files = await fetchGitHubFiles(owner, repo, branch, folderPath);
  const payloads = {
    payload: {},
  };
  const actions = [];
  const actionCount = {};

  for (const file of files) {
    if (file.type === "file") {
      console.log(`Fetching content for file: ${file.name}`);
      const content = await fetchFileContentRaw(owner, repo, branch, file.path);
      console.log(`\n=== Content of ${file.name} ===\n`);
      const data = content;
      let action = data.context.action;
      if (actions.includes(action)) {
        action = action + "_" + actionCount[action];
        actionCount[action] += 1;
      } else {
        actionCount[action] = 1;
        actions.push(action);
      }

      payloads.payload[action] = data;
      console.log("\n=====================\n");
    } else if (file.type === "dir") {
      const commentAnswer = await inquirer.prompt([
        {
          type: "input",
          name: "comment",
          message: `Enter a comment for the directory "${file.name}":`,
        },
      ]);

      console.log(`Exploring directory: ${file.name}`);
      if (commentAnswer.comment === "0") {
        continue;
      }

      await exploreGitHubFolder(
        owner,
        repo,
        branch,
        file.path,
        commentAnswer.comment
      );
    }
  }

  if (flow !== "") {
    const send = { ...templatePayload };
    send.flow = flow;
    send.payload = payloads.payload;

    // Create a JSON file for the payload
    const jsonFilePath = path.resolve(__dirname, `./payload/${flow}.json`);
    fs.writeFileSync(jsonFilePath, JSON.stringify(send, null, 2)); // Save pretty-printed JSON

    // Create the cURL command referencing the JSON file
    const curl = createCurlPostRequest(url, jsonFilePath);
    appendToFile(path.resolve(__dirname, `./payload/${flow}.sh`), curl);
  }

  return flow;
}

// Main function using Inquirer to get the folder URL and explore files/directories
async function getGitHubFolderFiles() {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "folderUrl",
      message:
        "Enter the GitHub folder URL (e.g., https://github.com/user/repo/tree/main/path/to/folder):",
    },
  ]);

  const folderUrl = answers.folderUrl;
  const parsedUrl = parseGitHubUrl(folderUrl);

  if (!parsedUrl) {
    console.log("Invalid GitHub URL format.");
    return;
  }

  const { owner, repo, branch, folderPath } = parsedUrl;

  console.log("Exploring folder and fetching files...");
  const comments = await exploreGitHubFolder(owner, repo, branch, folderPath);

  console.log("Comments collected for directories:");
  console.log(comments);
}

function createCurlPostRequest(url, jsonFilePath) {
  // Create the cURL command referencing the JSON file
  const curlCommand = `curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -d @${jsonFilePath}`;

  return curlCommand;
}

getGitHubFolderFiles();

(async () => {
  await getGitHubFolderFiles();
})();
