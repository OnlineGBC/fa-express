const fs = require("fs");
const path = require("path");
const eol = require("eol");
const { promisify } = require("util");
const { readdirSync } = require("fs");

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const rename = promisify(fs.rename);
const readdir = promisify(fs.readdir);

async function saveAction(
  filename,
  extension,
  menuTitle,
  { filePath, contents },
  folder
) {
  if (!["sh", "cmd", "json"].includes(extension)) {
    throw new Error("Invalid script extension");
  }
  const targetName = `${filename}.${extension}`;

  const newFilePath =
    folder == ""
      ? path.join("./scripts/", targetName)
      : path.join("./scripts/" + folder + "/", targetName);
  if (contents) {
    const normalizedContent = eol.lf(contents);
    await writeFile(newFilePath, normalizedContent, { encoding: "utf8" });
  } else {
    await rename(filePath, newFilePath);
  }
  await writeFile(`${newFilePath}.action-name`, menuTitle, {
    encoding: "utf8"
  });
}

function createSubFolder(name) {
  const baseDir = "./scripts/" + name;
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir);
  }
  return true;
}

async function getFileContent(path) {
  if(fs.existsSync(path)) {
    const data = fs.readFileSync(path, {encoding: 'utf-8'});
    return data
  }
  return ""
}

async function listActions() {
  const baseDir = "./scripts";
  const files = await readdir(baseDir);
  let fileList = await Promise.all(
    files
      .filter(fileName => fileName.endsWith(".action-name"))
      .map(async fileName => {
        const menuTitle = await readFile(path.join(baseDir, fileName), {
          encoding: "utf8"
        });
        return {
          scriptName: fileName.replace(".action-name", ""),
          menuTitle,
          filePath: path.resolve(
            path.join(baseDir, fileName.replace(".action-name", ""))
          )
        };
      })
  );
  let folders = {};
  const dirs = readdirSync(baseDir, { withFileTypes: true }).filter(dirent =>
    dirent.isDirectory()
  );
  await Promise.all(
    dirs.map(async dirent => {
      const subDir = baseDir + "/" + dirent.name;
      const subFiles = await readdir(subDir);
      folders[dirent.name] = await Promise.all(
        subFiles
          .filter(fileName => fileName.endsWith(".action-name"))
          .map(async fileName => {
            const menuTitle = await readFile(path.join(subDir, fileName), {
              encoding: "utf8"
            });
            return {
              scriptName: fileName.replace(".action-name", ""),
              menuTitle,
              filePath: path.resolve(
                path.join(subDir, fileName.replace(".action-name", ""))
              )
            };
          })
      );
    })
  );
  //console.log(folders);
  return { files: fileList, folders };
}

updateFileName = async (path, name, menu, type, fileContents) => {
  // let chName = path.split("\\");
  // chName[chName.length - 1] = name;
  if (type == "save") {
    if (path != name)
      fs.renameSync(path, name);
    if (menu != "") {
      const normalizedContent = eol.lf(menu);

      await writeFile(name + ".action-name", normalizedContent, { encoding: "utf8" });
      if (path != name) {
        fs.unlinkSync(path + ".action-name")
      }
    } else
      fs.renameSync(path + ".action-name", name + ".action-name");
    if (fileContents) {
      const normalizedContent = eol.lf(fileContents);
      await writeFile(name, normalizedContent, { encoding: "utf8" });
    }
  } else {
    if (path != name)
      fs.copyFileSync(path, name);
    if (menu != "") {
      const normalizedContent = eol.lf(menu);
      await writeFile(name + ".action-name", normalizedContent, { encoding: "utf8" });
    } else
      if (path != name)
        fs.copyFileSync(path + ".action-name", name + ".action-name");
        
    if (fileContents) {
      const normalizedContent = eol.lf(fileContents);
      await writeFile(name, normalizedContent, { encoding: "utf8" });
    }
  }

  return true;
};

updateFolderName = async (path, name) => {
  const baseDir = "./scripts/";
  if (path != name) {
    fs.renameSync(baseDir + path, baseDir + name)
  }
  return true
}

deleteFile = async (path, type) => {
  console.log(path, type)
  if (type == "folder") {
    path = './scripts/' + path
    deleteFolderRecursive(path)
  } else {
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
      fs.unlinkSync(path + ".action-name");
    }
  }

  return true;
};

deleteFolderRecursive = (filepath) => {
  if (fs.existsSync(filepath)) {
    fs.readdirSync(filepath).forEach((file, index) => {
      const curPath = path.join(filepath, file);
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(filepath);
  }
};

module.exports = {
  saveAction,
  listActions,
  createSubFolder,
  updateFileName,
  deleteFile,
  updateFolderName,
  getFileContent
};
