#! /usr/bin/env node
"use strict";

const updateNotifier = require("update-notifier");
const pkg = require("./package.json");
const service = require("./services");

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

  const message = Array.from(args).join(" ");

  switch (action.toLowerCase()) {
    case "logsync":
      service.logSync(message);
      break;
    case "errorsync":
      service.errorSync(message);
      break;
    case "warnsync":
      service.warnSync(message);
      break;
    case "log":
      service.log(message, () => console.log(message));
      break;
    case "error":
      service.error(message, () => console.error(message));
      break;
    case "warn":
      service.warn(message, () => console.warn(message));
      break;
  }
}

main();
