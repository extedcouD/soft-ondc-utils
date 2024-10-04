const inquirer = require("inquirer");
const fs = require("fs-extra");
const path = require("path");
const yaml = require("js-yaml");
const axios = require("axios");
async function selectIndexFiles() {
  const questions = [
    {
      type: "input",
      name: "source",
      message: "Enter the new build",
      validate: function (value) {
        if (fs.existsSync(value) && fs.lstatSync(value).isFile()) {
          return true;
        } else {
          return "Please enter a valid source folder path.";
        }
      },
    },
  ];
  const answers = await inquirer.prompt(questions);
  return answers;
}

async function copyIndexFiles(source) {
  const sourceData = yaml.load(fs.readFileSync(source, "utf8"));
  async function fetchGitFileContent(url) {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      throw new Error("Error fetching file from Git: " + error.message);
    }
  }

  const gitFileUrl = await inquirer.prompt([
    {
      type: "input",
      name: "gitFileUrl",
      message: "Enter the URL of the Git file",
      validate: function (value) {
        if (value.startsWith("http")) {
          return true;
        } else {
          return "Please enter a valid URL.";
        }
      },
    },
  ]);

  const gitFileContent = await fetchGitFileContent(gitFileUrl.gitFileUrl);
  console.log("gitFileContent", gitFileContent);
  const gitFileData = yaml.load(gitFileContent);
  fs.writeFileSync(
    "gitData.json",
    JSON.stringify(gitFileData, null, 2),
    "utf8"
  );
  fs.writeFileSync(
    "sourceData.json",
    JSON.stringify(sourceData, null, 2),
    "utf8"
  );
}

(async function () {
  try {
    const { source, destination } = await selectIndexFiles();
    await copyIndexFiles(source, destination);
    console.log("Files copied successfully!");
  } catch (error) {
    console.error("Error copying files:", error);
  }
})();
