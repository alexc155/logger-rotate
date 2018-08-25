"use strict";

const {
  appendFileSync,
  appendFile,
  renameSync,
  unlinkSync,
  mkdir,
  mkdirSync,
  existsSync,
  readdirSync,
  readdir,
  readFileSync,
  writeFileSync,
  readFile,
  writeFile
} = require("fs");

const { EOL } = require("os");

const { consoleLog } = require("../utils");

const LOG_FOLDER = require("../logger-rotate.config.json").LOG_FOLDER;

const flooredDate = new Date().toISOString().substring(0, 10);

function dateDiffInDays(a, b) {
  // Discard the time and time-zone information.
  var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.floor((utc2 - utc1) / MS_PER_DAY);
}

function makeFolderSync() {
  if (!existsSync(LOG_FOLDER)) {
    mkdirSync(LOG_FOLDER);
  }
}

function makeFolder(callback, testingError) {
  mkdir(LOG_FOLDER, err => {
    if (testingError || (err && err.code !== "EEXIST")) {
      err = err || "Test Error";
      callback(err);
    } else {
      callback();
    }
  });
}

function rotateLogFilesSync(name, suffix) {
  try {
    unlinkSync(`${LOG_FOLDER}/${name}.09`);
  } catch (error) {
    if (error.code !== "ENOENT") {
      consoleLog.error(`rotateLogFilesSync: ${error}`);
      throw error;
    }
  }
  for (let fileNumber = 9; fileNumber > 0; fileNumber--) {
    if (existsSync(`${LOG_FOLDER}/${name}.0${fileNumber - 1}`)) {
      renameSync(
        `${LOG_FOLDER}/${name}.0${fileNumber - 1}`,
        `${LOG_FOLDER}/${name}.0${fileNumber}`
      );
    }
  }

  renameSync(`${LOG_FOLDER}/${name}.${suffix}.log`, `${LOG_FOLDER}/${name}.01`);
}

function makeLogFileSync(name) {
  const logPath = `${LOG_FOLDER}/${name}.${flooredDate}.log`;

  const pattern = RegExp(`${name}.\\d{4}-\\d{2}-\\d{2}`);

  for (const item of readdirSync(LOG_FOLDER)) {
    if (pattern.test(item)) {
      const date = item.replace(`${name}.`, "").replace(".log", "");
      if (dateDiffInDays(new Date(date), new Date()) >= 1) {
        rotateLogFilesSync(name, date);
      }
    }
  }
  if (!existsSync(logPath)) {
    appendFileSync(logPath, EOL);
  }
}

function rotateLogFiles(name, testingCallback) {
  readdir(LOG_FOLDER, function(err, items) {
    if (items) {
      const pattern = RegExp(`${name}.\\d{4}-\\d{2}-\\d{2}.log`);

      for (const item of items) {
        if (pattern.test(item)) {
          const date = item.replace(`${name}.`, "").replace(".log", "");
          if (dateDiffInDays(new Date(date), new Date()) >= 1) {
            rotateLogFilesSync(name, date);
            const logPath = `${LOG_FOLDER}/${name}.${flooredDate}.log`;
            appendFileSync(logPath, EOL);
          }
        }
      }
    }
    if (testingCallback) testingCallback();
  });
}

function writeRecentLogSync(message) {
  appendFileSync(`${LOG_FOLDER}/recent.log`, "");

  const recentMessages = readFileSync(`${LOG_FOLDER}/recent.log`, {
    encoding: "utf8"
  }).split(EOL);

  const newRecentMessages = [message.trim()].concat(
    recentMessages.slice(0, 499)
  );

  writeFileSync(`${LOG_FOLDER}/recent.log`, newRecentMessages.join(EOL));
}

function writeRecentLog(message, callback) {
  appendFile(`${LOG_FOLDER}/recent.log`, "", err => {
    if (err) {
      callback(err);
    }
    readFile(
      `${LOG_FOLDER}/recent.log`,
      {
        encoding: "utf8"
      },
      (err, contents) => {
        let recentMessages = [];
        if (contents) {
          recentMessages = contents.split(EOL);
        }
        const newRecentMessages = [message.trim()].concat(
          recentMessages.slice(0, 499)
        );
        writeFile(
          `${LOG_FOLDER}/recent.log`,
          newRecentMessages.join(EOL),
          () => {
            callback();
          }
        );
      }
    );
  });
}

function logMessage(name, message, callback, testingError, testingCallback) {
  if (message.toString().trim() === "") {
    callback();
  }

  rotateLogFiles(name, testingCallback);

  message = `${new Date().toUTCString()} - ${message
    .toString()
    .replace(/EOL/g, "\\n")
    .replace(/\r\n/g, "\\n")
    .replace(/\r/g, "\\n")
    .replace(/\n/g, "\\n")}${EOL}`;

  writeRecentLog(message, err => {
    if (testingError || err) {
      if (!testingError && err.code === "ENOENT") {
        makeFolder(callback);
      } else {
        err = err || "Test Error";
        callback(err);
      }
      return;
    }

    appendFile(`${LOG_FOLDER}/${name}.${flooredDate}.log`, message, () => {
      callback();
    });
  });
}

function logMessageSync(name, message) {
  const date = new Date().toUTCString();

  if (message.toString().trim() === "") {
    return;
  }

  message = `${date} - ${message
    .toString()
    .replace(/EOL/g, "\\n")
    .replace(/\r\n/g, "\\n")
    .replace(/\r/g, "\\n")
    .replace(/\n/g, "\\n")}${EOL}`;

  writeRecentLogSync(message);

  appendFileSync(`${LOG_FOLDER}/${name}.${flooredDate}.log`, message);
}

function log(message, callback) {
  logMessage("info", message, callback);
}

function logSync(message, silent) {
  if (!silent) {
    consoleLog.info(message);
  }

  makeFolderSync();

  makeLogFileSync("info");

  logMessageSync("info", message);
}

function error(message, callback) {
  logMessage("error", message, callback);
}

function errorSync(message, silent) {
  if (!silent) {
    consoleLog.error(message);
  }

  makeFolderSync();

  makeLogFileSync("error");

  logMessageSync("error", message);
}

function warn(message, callback) {
  logMessage("warn", message, callback);
}

function warnSync(message, silent) {
  if (!silent) {
    console.warn(message);
  }

  makeFolderSync();

  makeLogFileSync("warn");

  logMessageSync("warn", message);
}

function showRecent(lines) {
  return readFileSync(`${LOG_FOLDER}/recent.log`, { encoding: "utf8" })
    .split(EOL)
    .slice(0, lines)
    .reverse()
    .join(EOL)
    .replace(/\\n/g, EOL);
}

module.exports = {
  logSync,
  errorSync,
  warnSync,
  log,
  error,
  warn,
  dateDiffInDays,
  makeFolderSync,
  makeFolder,
  rotateLogFilesSync,
  makeLogFileSync,
  logMessage,
  logMessageSync,
  writeRecentLog,
  showRecent,
  LOG_FOLDER
};
