#! /usr/bin/env node
"use strict";

const updateNotifier = require("update-notifier");
const pkg = require("./package.json");
const service = require("./services");
const { writeConfig } = require("./config");
const { existsSync, mkdirSync } = require("fs");

function setLogFolder(location) {
  if (!existsSync(location)) {
    mkdirSync(location);
  }
  writeConfig("LOG_FOLDER", location);
}

function main() {
  updateNotifier({
    pkg
  }).notify({
    isGlobal: true
  });

  let action = process.argv[2];
  action = action || "";
  const args = process.argv.slice(3);

  const message = Array.from(args).join(" ");

  switch (action.toLowerCase()) {
    case "logsync":
      service.logSync(message, false);
      break;
    case "errorsync":
      service.errorSync(message, false);
      break;
    case "warnsync":
      service.warnSync(message, false);
      break;
    case "error":
      service.error(message, () => console.error(message));
      break;
    case "warn":
      service.warn(message, () => console.warn(message));
      break;
    case "setlogfolder":
      setLogFolder(message);
      break;
    case "showrecent":
      console.log(service.showRecent(20));
      break;
    case "log":
      service.log(message, () => console.log(message));
      break;
  }
}

main();

module.exports = {
  logSync: service.logSync,
  errorSync: service.errorSync,
  warnSync: service.warnSync,
  log: service.log,
  error: service.error,
  warn: service.warn,
  showRecent: service.showRecent,
  setLogFolder
};
