const fs = require("fs-extra");
const path = require("path");
const bluebird = require("bluebird");
const log = require("./logger");

const TRY_FILENAMES = ["template", "template/welcome-cadet.md"].map(
  (basename) => path.resolve(__dirname, basename)
);

function logWelcomeLetter({ cosmonautId, shuttle }) {
  console.log(cosmonautId);
  console.log(shuttle);
  bluebird
    .filter(TRY_FILENAMES, (filename) =>
      fs.lstat(filename).then((stat) => stat.isFile && !stat.isDirectory)
    )
    .then((filenames) => {
      // take the first file, assume it's the desired template
      const templateFilename = filenames[0];
      log(`selected cadet welcome template file: ${templateFilename}`);
      return fs.readFile(templateFilename).then((content) => {
        console.log(
          content
            .toString()
            .replace("{cosmonautId}", cosmonautId)
            .replace("{days}", shuttle.date)
            .replace("{shuttleName}", shuttle.name)
        );
      });
    })
    .catch(() => {
      throw new Error(`failed to log cosmonaut ${cosmonautId} welcome letter`);
    });
}

module.exports = {
  logWelcomeLetter,
};
