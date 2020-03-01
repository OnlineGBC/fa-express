const fs = require('fs');
const path = require('path');
const eol = require('eol');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const rename = promisify(fs.rename);
const readdir = promisify(fs.readdir);

async function saveAction(filename, extension, menuTitle, { filePath, contents }) {
  const targetName = `${filename}.${extension}`;
  const newFilePath = path.join('./scripts/', targetName);
  if (contents) {
    const normalizedContent = eol.lf(contents);
    await writeFile(newFilePath, normalizedContent, { encoding: 'utf8' });
  } else {
    await rename(filePath, newFilePath);
  }
  await writeFile(`${newFilePath}.action-name`, menuTitle, { encoding: 'utf8' });
}

async function listActions() {
  const baseDir = './scripts';
  const files = await readdir(baseDir);
  return Promise.all(files.filter(fileName => fileName.endsWith('.action-name'))
    .map(async fileName => {
      const menuTitle = await readFile(path.join(baseDir, fileName), { encoding: 'utf8' });
      return {
        scriptName: fileName.replace('.action-name', ''),
        menuTitle,
      };
    }));
}

module.exports = {
  saveAction,
  listActions,
};
