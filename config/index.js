"use strict";

const { existsSync, writeFileSync, readFileSync } = require("fs");
const { consoleLog } = require("../utils");

const CONFIG_FILE = "./logger-rotate.config.json";

function writeConfig(setting, value) {
  try {
    if (!setting) {
      throw "Setting is undefined";
    }
    if (!existsSync(CONFIG_FILE)) {
      writeFileSync(CONFIG_FILE, "{}");
    }

    let config = JSON.parse(readFileSync(CONFIG_FILE, { encoding: "utf8" }));

    config[setting] = value;

    writeFileSync(CONFIG_FILE, JSON.stringify(config));
    return true;
  } catch (error) {
    consoleLog.error("Error in writeConfig: ");
    consoleLog.error(error);
    return false;
  }
}

function readConfig(setting, defaultValue) {
  if (!existsSync(CONFIG_FILE)) {
    writeFileSync(CONFIG_FILE, "{}");
  }

  const config = JSON.parse(readFileSync(CONFIG_FILE, { encoding: "utf8" }));

  if (!config[setting] && !defaultValue) {
    consoleLog.error("Config setting does not exist");
    return;
  } else if (!config[setting]) {
    writeConfig(setting, defaultValue);
    return defaultValue;
  }

  return config[setting];
}

module.exports = {
  writeConfig,
  readConfig
};
