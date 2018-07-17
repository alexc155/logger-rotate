const { expect } = require("chai");
const mockFs = require("mock-fs");
const sinon = require("sinon");

const { existsSync, readFileSync } = require("fs");

const { EOL } = require("os");

const sut = require("./index");

describe("#services", function() {
  it("Correctly calculates the difference between 2 dates", function() {
    const result = sut.dateDiffInDays(
      new Date(2018, 11, 24, 10, 33, 30, 0),
      new Date(2018, 11, 25, 10, 33, 30, 0)
    );
    expect(result).to.equal(1);
  });

  it("Creates a log folder if it doesn't exist", function() {
    sut.makeFolderSync();
    expect(existsSync(sut.LOG_FOLDER)).to.be.equal(true);
  });

  it("Doesn't error trying to create a log folder if it exists", function() {
    mockFs({
      "./logs": {}
    });
    sut.makeFolderSync();

    expect(existsSync(sut.LOG_FOLDER)).to.be.equal(true);
    mockFs.restore();
  });

  it("Rotates log files", function() {
    mockFs({
      "./logs": {
        "info.09": "log 9",
        "info.08": "log 8",
        "info.07": "log 7",
        "info.06": "log 6",
        "info.05": "log 5",
        "info.04": "log 4",
        "info.03": "log 3",
        "info.02": "log 2",
        "info.01": "log 1",
        "info.log": "log today"
      }
    });

    sut.rotateLogFilesSync("info");

    expect(
      readFileSync(`${sut.LOG_FOLDER}/info.01`, { encoding: "utf8" })
    ).to.equal("log today");

    expect(
      readFileSync(`${sut.LOG_FOLDER}/info.09`, { encoding: "utf8" })
    ).to.equal("log 8");
    mockFs.restore();
  });

  it("Errors rotating log files if there's a problem with the file system", function() {
    const consoleError = console.error;
    console.error = function() {};
    sinon.spy(console, "error");

    mockFs({
      "./logs": {
        "info.09": {}
      }
    });

    try {
      sut.rotateLogFilesSync("info");
    } catch (error) {}
    mockFs.restore();

    expect(console.error.firstCall.lastArg.code).to.equal("EPERM");

    console.error.restore();
    console.error = consoleError;
  });

  it("Makes a log file if it doesn't exist", function() {
    mockFs({
      "./logs": {}
    });
    sut.makeLogFileSync("info");

    expect(
      readFileSync(`${sut.LOG_FOLDER}/info.log`, { encoding: "utf8" })
    ).to.equal(EOL);
    mockFs.restore();
  });

  it("Uses a log file if it exists", function() {
    mockFs({
      "./logs": { "info.log": "log today" }
    });
    sut.makeLogFileSync("info");

    expect(
      readFileSync(`${sut.LOG_FOLDER}/info.log`, { encoding: "utf8" })
    ).to.equal("log today");
    mockFs.restore();
  });

  it("Rotates the log file if needed", function() {
    mockFs({
      "./logs": {
        "info.log": mockFs.file({
          content: "log today",
          birthtime: new Date(1)
        })
      }
    });
    sut.makeLogFileSync("info");

    expect(
      readFileSync(`${sut.LOG_FOLDER}/info.01`, { encoding: "utf8" })
    ).to.equal("log today");

    expect(
      readFileSync(`${sut.LOG_FOLDER}/info.log`, { encoding: "utf8" })
    ).to.equal(EOL);
    mockFs.restore();
  });

  it("Writes a time-stamped message to a log file", function() {
    mockFs({
      "./logs": { "info.log": EOL }
    });
    sut.logMessageSync("info", "hello world");
    expect(
      readFileSync(`${sut.LOG_FOLDER}/info.log`, {
        encoding: "utf8"
      })
    ).to.match(
      /\w{3}, \d{0,2} \w{3} \d{4} \d{2}:\d{2}:\d{2} \w{3} - hello world/gm
    );
    mockFs.restore();
  });

  it("logs an info message", function() {
    const consoleLog = console.log;
    console.log = function() {};

    mockFs({
      "./logs": {}
    });

    sut.log(["hello world"]);
    expect(
      readFileSync(`${sut.LOG_FOLDER}/info.log`, {
        encoding: "utf8"
      })
    ).to.match(
      /\w{3}, \d{0,2} \w{3} \d{4} \d{2}:\d{2}:\d{2} \w{3} - hello world/gm
    );
    mockFs.restore();
    console.log = consoleLog;
  });

  it("logs an error message", function() {
    const consoleError = console.error;
    console.error = function() {};

    mockFs({
      "./logs": {}
    });

    try {
      sut.error(["hello world"]);
    } catch (error) {
      console.error = consoleError;
      console.error(error);
    }

    expect(
      readFileSync(`${sut.LOG_FOLDER}/error.log`, {
        encoding: "utf8"
      })
    ).to.match(
      /\w{3}, \d{0,2} \w{3} \d{4} \d{2}:\d{2}:\d{2} \w{3} - hello world/gm
    );
    mockFs.restore();
    console.error = consoleError;
  });

  it("logs a warning message", function() {
    const consoleWarn = console.warn;
    console.warn = function() {};

    mockFs({
      "./logs": {}
    });

    sut.warn(["hello world"]);
    expect(
      readFileSync(`${sut.LOG_FOLDER}/warn.log`, {
        encoding: "utf8"
      })
    ).to.match(
      /\w{3}, \d{0,2} \w{3} \d{4} \d{2}:\d{2}:\d{2} \w{3} - hello world/gm
    );
    mockFs.restore();
    console.warn = consoleWarn;
  });
});
