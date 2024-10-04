const inquirer = require("inquirer");
const fs = require("fs-extra");
const path = require("path");

// Function to prompt the user to select source and destination folders
async function selectFolders() {
  const questions = [
    {
      type: "input",
      name: "source",
      message: "Enter the source folder path:",
      validate: function (value) {
        if (fs.existsSync(value) && fs.lstatSync(value).isDirectory()) {
          return true;
        } else {
          return "Please enter a valid source folder path.";
        }
      },
    },
    {
      type: "input",
      name: "destination",
      message: "Enter the destination folder path:",
      validate: function (value) {
        if (fs.existsSync(value) && fs.lstatSync(value).isDirectory()) {
          return true;
        } else {
          return "Please enter a valid destination folder path.";
        }
      },
    },
  ];

  const answers = await inquirer.prompt(questions);
  return answers;
}

// Function to copy files from source to destination
async function copyFilesFromSourceToDestination(
  sourceFolder,
  destinationFolder
) {
  const folders = await fs.readdir(sourceFolder);

  for (const folder of folders) {
    const sourceSubfolderPath = path.join(sourceFolder, folder);
    const destinationSubfolderPath = path.join(destinationFolder, folder);

    // Check if the item is a folder
    if (fs.lstatSync(sourceSubfolderPath).isDirectory()) {
      // Copy the folder content from source to destination (merging new files)
      await fs.ensureDir(destinationSubfolderPath); // Ensure destination folder exists
      await fs.copy(sourceSubfolderPath, destinationSubfolderPath, {
        overwrite: false,
      });
      console.log(
        `Copied contents of ${sourceSubfolderPath} to ${destinationSubfolderPath}`
      );
    }
  }
}

// Main function to run the process
(async function () {
  try {
    const { source, destination } = await selectFolders();
    await copyFilesFromSourceToDestination(source, destination);
    console.log("Files copied successfully!");
  } catch (error) {
    console.error("Error copying files:", error);
  }
})();
