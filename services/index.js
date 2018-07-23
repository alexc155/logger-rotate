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
  readdir
} = require("fs");

const { EOL } = require("os");

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
      console.error("rotateLogFilesSync: ", error);
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
            appendFileSync(`${LOG_FOLDER}/${name}.log`, EOL);
          }
        }
      }
    }
    if (testingCallback) testingCallback();
  });
}

function logMessage(name, message, callback, testingError, testingCallback) {
  rotateLogFiles(name, testingCallback);

  message = `${new Date().toUTCString()} - ${message}${EOL}`;

  appendFile(`${LOG_FOLDER}/${name}.${flooredDate}.log`, message, err => {
    if (testingError || err) {
      if (!testingError && err.code === "ENOENT") {
        makeFolder(callback);
      } else {
        err = err || "Test Error";
        callback(err);
      }
      return;
    }
    callback();
  });
}

function logMessageSync(name, message) {
  message = `${new Date().toUTCString()} - ${message}${EOL}`;
  appendFileSync(`${LOG_FOLDER}/${name}.${flooredDate}.log`, message);
}

function log(message, callback) {
  logMessage("info", message, callback);
}

function logSync(message) {
  console.log(message);

  makeFolderSync();

  makeLogFileSync("info");

  logMessageSync("info", message);
}

function error(message, callback) {
  logMessage("error", message, callback);
}

function errorSync(message) {
  console.error(message);

  makeFolderSync();

  makeLogFileSync("error");

  logMessageSync("error", message);
}

function warn(message, callback) {
  logMessage("warn", message, callback);
}

function warnSync(message) {
  console.warn(message);

  makeFolderSync();

  makeLogFileSync("warn");

  logMessageSync("warn", message);
}

// logMessage("info", "hello", () => {});

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
  LOG_FOLDER
};
