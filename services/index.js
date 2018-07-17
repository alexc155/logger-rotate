"use strict";

const {
  appendFileSync,
  renameSync,
  unlinkSync,
  mkdirSync,
  existsSync,
  lstatSync
} = require("fs");

const { EOL } = require("os");

const LOG_FOLDER = `${__dirname}/../logs`;

function dateDiffInDays(a, b) {
  // Discard the time and time-zone information.
  var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.floor((utc2 - utc1) / MS_PER_DAY);
}

function makeFolderSync() {
  if (!existsSync(`${LOG_FOLDER}`)) {
    mkdirSync(`${LOG_FOLDER}`);
  }
}

function rotateLogFilesSync(name) {
  try {
    unlinkSync(`${LOG_FOLDER}/${name}.09`);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(error);
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
  renameSync(`${LOG_FOLDER}/${name}.log`, `${LOG_FOLDER}/${name}.01`);
}

function makeLogFileSync(name) {
  if (!existsSync(`${LOG_FOLDER}/${name}.log`)) {
    appendFileSync(`${LOG_FOLDER}/${name}.log`, EOL);
  } else if (
    dateDiffInDays(
      lstatSync(`${LOG_FOLDER}/${name}.log`).birthtime,
      new Date()
    ) >= 1
  ) {
    rotateLogFilesSync(name);
    appendFileSync(`${LOG_FOLDER}/${name}.log`, EOL);
  }
}

function logMessageSync(name, message) {
  message = `${new Date().toUTCString()} - ${message}${EOL}`;
  appendFileSync(`${LOG_FOLDER}/${name}.log`, message);
}

function log() {
  console.log(Array.from(arguments)[0].join(" "));

  makeFolderSync();

  makeLogFileSync("info");

  logMessageSync("info", Array.from(arguments)[0].join(" "));
}

function error() {
  console.error(Array.from(arguments)[0].join(" "));

  makeFolderSync();

  makeLogFileSync("error");

  logMessageSync("error", Array.from(arguments)[0].join(" "));
}

function warn() {
  console.warn(Array.from(arguments)[0].join(" "));

  makeFolderSync();

  makeLogFileSync("warn");

  logMessageSync("warn", Array.from(arguments)[0].join(" "));
}

module.exports = {
  log,
  error,
  warn,
  dateDiffInDays,
  makeFolderSync,
  rotateLogFilesSync,
  makeLogFileSync,
  logMessageSync,
  LOG_FOLDER
};
