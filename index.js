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

  switch (action.toLowerCase()) {
    case "log":
      service.log(args);
      break;
    case "error":
      service.error(args);
      break;
    case "warn":
      service.warn(args);
      break;
  }
}

main();
