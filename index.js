#! /usr/bin/env node
"use strict";

const updateNotifier = require("update-notifier");
const pkg = require("./package.json");

function showHelp() {
  log.info(`
  Description.

  Available commands:

    --help                    | -h

  Example usage:
    $ ...

  Notes:
    * Note
`);
}

function main() {
  updateNotifier({
    pkg,
    updateCheckInterval: 0
  }).notify({
    isGlobal: true
  });

  let action = process.argv[2];
  action = action || "";
  const args = process.argv.slice(3);

  switch (action.toLowerCase()) {
    case "-h":
    case "--help":
    case "":
    case undefined:
    default:
      showHelp();
      break;
  }
}

main();
