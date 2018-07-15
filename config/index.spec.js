"use strict";

const { readFileSync, writeFileSync, unlinkSync } = require("fs");

const { expect } = require("chai");
const mockFs = require("mock-fs");
const sinon = require("sinon");

const CONFIG_FILE = "./logger-rotate.config";

const sut = require("./index");

const consoleError = console.error;

beforeEach(function() {
  mockFs({
    "./": {}
  });
  console.error = function() {};
  sinon.spy(console, "log");
  sinon.spy(console, "error");
});

afterEach(function() {
  mockFs.restore();
  console.log.restore();
  console.error.restore();
  console.error = consoleError;
});

describe("#config", function() {
  it("writes a value to the config file", function() {
    sut.writeConfig("setting", "value");
    // Run a second time to run thru' if the config file was missing.
    sut.writeConfig("setting", "value");

    const result = readFileSync(CONFIG_FILE, { encoding: "utf8" });
    expect(result).to.equal(
      JSON.stringify({
        setting: "value"
      })
    );
  });

  it("errors writing an invalid setting to the config file", function() {
    const result = sut.writeConfig(undefined, "value");

    expect(result).to.equal(false);

    expect(console.error.calledWith("Error in writeConfig: ")).to.equal(true);
  });

  it("reads a setting from the config file", function() {
    writeFileSync(
      CONFIG_FILE,
      JSON.stringify({
        setting: "value"
      })
    );

    const setting = sut.readConfig("setting");

    expect(setting).to.equal("value");
  });

  it("returns the default value when reading a setting if the setting doesn't exist and there is a default", function() {
    writeFileSync(
      CONFIG_FILE,
      JSON.stringify({
        setting: "value"
      })
    );

    const setting = sut.readConfig("missing_setting", "/path/to/files");

    expect(setting).to.equal("/path/to/files");
  });

  it("errors when reading a setting from the config file if the setting doesn't exist and there is no default", function() {
    writeFileSync(
      CONFIG_FILE,
      JSON.stringify({
        setting: "value"
      })
    );

    const setting = sut.readConfig("invalid_setting");

    expect(setting).to.equal(undefined);

    expect(console.error.calledWith("Config setting does not exist")).to.equal(
      true
    );
  });

  it("errors when reading a setting from the config file if the config file doesn't exist", function() {
    writeFileSync(
      CONFIG_FILE,
      JSON.stringify({
        setting: "value"
      })
    );

    unlinkSync(CONFIG_FILE);

    const setting = sut.readConfig("setting");

    expect(setting).to.equal(undefined);

    expect(console.error.calledWith("Config file does not exist")).to.equal(
      true
    );
  });
});
