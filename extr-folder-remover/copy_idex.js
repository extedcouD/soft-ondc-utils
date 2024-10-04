const inquirer = require("inquirer");
const fs = require("fs-extra");
const path = require("path");
const yaml = require("js-yaml");
async function selectIndexFiles() {
  const questions = [
    {
      type: "input",
      name: "source",
      message: "Enter the source file",
      validate: function (value) {
        if (fs.existsSync(value) && fs.lstatSync(value).isFile()) {
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
        if (fs.existsSync(value) && fs.lstatSync(value).isFile()) {
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

async function copyIndexFiles(source, destination) {
  const sourceData = yaml.load(fs.readFileSync(source, "utf8"));
  const destinationData = yaml.load(fs.readFileSync(destination, "utf8"));
  console.log("sourceData", sourceData);
  console.log("destinationData", destinationData);
  for (const key in sourceData) {
    if (destinationData[key]) {
      list1 = sourceData[key].examples;
      list2 = destinationData[key].examples;
      list1.forEach((item) => {
        if (!list2.includes(item)) {
          list2.push(item);
        }
      });
      destinationData[key].examples = list2;
    }
  }
  fs.writeFileSync(destination, yaml.dump(destinationData), "utf8");
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
