const { expect } = require("chai");
const mockFs = require("mock-fs");
const sinon = require("sinon");
const proxyquire = require("proxyquire").noPreserveCache();

const mockUtils = {
  consoleLog: {
    error: function() {},
    info: function() {}
  }
};

const { existsSync, readFileSync, appendFileSync } = require("fs");

const { EOL } = require("os");

const sut = proxyquire("./index", {
  "../utils": mockUtils
});

const flooredDate = new Date().toISOString().substring(0, 10);

describe("#services", function() {
  it("Correctly calculates the difference between 2 dates", function() {
    const result = sut.dateDiffInDays(
      new Date(2018, 11, 24, 10, 33, 30, 0),
      new Date(2018, 11, 25, 10, 33, 30, 0)
    );
    expect(result).to.equal(1);
  });

  it("Creates a log folder if it doesn't exist", function() {
    mockFs({
      "./": {}
    });
    sut.makeFolderSync();
    expect(existsSync(sut.LOG_FOLDER)).to.be.true;
    mockFs.restore();
  });

  it("Asynchronously creates a log folder", function() {
    mockFs({
      "./": {}
    });

    sut.makeFolder(() => {
      expect(existsSync(sut.LOG_FOLDER)).to.be.true;
      mockFs.restore();
    });
  });

  it("Asynchronously doesn't error when trying to create a log folder if it already exists", function() {
    mockFs({ [sut.LOG_FOLDER]: {} });

    sut.makeFolder(() => {
      expect(existsSync(sut.LOG_FOLDER)).to.be.true;
      mockFs.restore();
    });
  });

  it("Asynchronously errors when trying to create a log folder if there's a problem with the disk", function() {
    mockFs({ "./": {} });

    sut.makeFolder(err => {
      expect(err).to.be.equal("Test Error");
      mockFs.restore();
    }, true);
  });

  it("Doesn't error trying to create a log folder if it exists", function() {
    mockFs({ [sut.LOG_FOLDER]: {} });
    sut.makeFolderSync();

    expect(existsSync(sut.LOG_FOLDER)).to.be.true;
    mockFs.restore();
  });

  it("Rotates log files", function() {
    mockFs({
      [sut.LOG_FOLDER]: {
        "info.09": "log 9",
        "info.08": "log 8",
        "info.07": "log 7",
        "info.06": "log 6",
        "info.05": "log 5",
        "info.04": "log 4",
        "info.03": "log 3",
        "info.02": "log 2",
        "info.01": "log 1",
        [`info.${flooredDate}.log`]: "log today"
      }
    });

    sut.rotateLogFilesSync("info", flooredDate);

    expect(
      readFileSync(`${sut.LOG_FOLDER}/info.01`, { encoding: "utf8" })
    ).to.equal("log today");

    expect(
      readFileSync(`${sut.LOG_FOLDER}/info.09`, { encoding: "utf8" })
    ).to.equal("log 8");

    mockFs.restore();
  });

  it("Errors rotating log files if there's a problem with the file system", function() {
    sinon.spy(mockUtils.consoleLog, "error");

    mockFs({ [sut.LOG_FOLDER]: { "info.09": {} } });

    try {
      sut.rotateLogFilesSync("info");
    } catch (error) {}

    mockFs.restore();

    expect(mockUtils.consoleLog.error.called).to.be.true;

    expect(mockUtils.consoleLog.error.firstCall.args[0]).to.contain("EPERM");

    mockUtils.consoleLog.error.restore();
  });

  it("Makes a log file if it doesn't exist", function() {
    mockFs({
      [sut.LOG_FOLDER]: {}
    });
    sut.makeLogFileSync("info");

    expect(
      readFileSync(`${sut.LOG_FOLDER}/info.${flooredDate}.log`, {
        encoding: "utf8"
      })
    ).to.equal(EOL);
    mockFs.restore();
  });

  it("Uses a log file if it exists", function() {
    mockFs({
      [sut.LOG_FOLDER]: { [`info.${flooredDate}.log`]: "log today" }
    });

    sut.makeLogFileSync("info");

    expect(
      readFileSync(`${sut.LOG_FOLDER}/info.${flooredDate}.log`, {
        encoding: "utf8"
      })
    ).to.equal("log today");

    mockFs.restore();
  });

  it("Rotates the log file if needed", function() {
    mockFs({
      [sut.LOG_FOLDER]: {
        [`info.1970-01-01.log`]: mockFs.file({
          content: "log from long ago",
          birthtime: new Date(1)
        }),
        ["info.01"]: "archived log"
      }
    });

    sut.makeLogFileSync("info");

    expect(
      readFileSync(`${sut.LOG_FOLDER}/info.01`, {
        encoding: "utf8"
      })
    ).to.equal("log from long ago");

    expect(
      readFileSync(`${sut.LOG_FOLDER}/info.02`, { encoding: "utf8" })
    ).to.equal("archived log");

    expect(
      readFileSync(`${sut.LOG_FOLDER}/info.${flooredDate}.log`, {
        encoding: "utf8"
      })
    ).to.equal(EOL);

    mockFs.restore();
  });

  it("Writes a time-stamped message to a log file", function() {
    mockFs({
      [sut.LOG_FOLDER]: { [`info.${flooredDate}.log`]: EOL }
    });

    sut.logMessageSync("info", "hello world 1");

    expect(
      readFileSync(`${sut.LOG_FOLDER}/info.${flooredDate}.log`, {
        encoding: "utf8"
      })
    ).to.match(
      /\w{3}, \d{0,2} \w{3} \d{4} \d{2}:\d{2}:\d{2} \w{3} - hello world 1/gm
    );

    mockFs.restore();
  });

  it("Does nothing when trying to write an empty message", function() {
    mockFs({ [sut.LOG_FOLDER]: { [`info.${flooredDate}.log`]: EOL } });

    sut.logMessageSync("info", "");

    expect(
      readFileSync(`${sut.LOG_FOLDER}/info.${flooredDate}.log`, {
        encoding: "utf8"
      })
    ).to.equal(EOL);

    mockFs.restore();
  });

  it("Asynchronously writes a time-stamped message to a log file", function() {
    mockFs({ [sut.LOG_FOLDER]: {} });

    appendFileSync(`${sut.LOG_FOLDER}/info.${flooredDate}.log`, EOL);

    sut.logMessage("info", "hello world 2", () => {
      expect(
        readFileSync(`${sut.LOG_FOLDER}/info.${flooredDate}.log`, {
          encoding: "utf8"
        })
      ).to.match(
        /\w{3}, \d{0,2} \w{3} \d{4} \d{2}:\d{2}:\d{2} \w{3} - hello world 2/gm
      );

      mockFs.restore();
    });
  });

  it("Asynchronously creates a log folder when writing a time-stamped message to a log file if it doesn't exist", function() {
    mockFs({ "./": {} });

    sut.logMessage("info", "hello world 3", () => {
      expect(existsSync(sut.LOG_FOLDER));
      mockFs.restore();
    });
  });

  it("Asynchronously errors when writing a time-stamped message to a log file if it can't write to the file", function() {
    mockFs({ [sut.LOG_FOLDER]: {} });

    appendFileSync(`${sut.LOG_FOLDER}/info.${flooredDate}.log`, EOL);

    appendFileSync(`${sut.LOG_FOLDER}/random.file`, EOL);

    sut.logMessage(
      "info",
      "hello world 3",
      err => {
        expect(err).to.equal("Test Error");
        mockFs.restore();
      },
      true
    );
  });

  it("Asynchronously rotates log file when writing a message if the log file is old", function() {
    mockFs({
      [sut.LOG_FOLDER]: {
        "info.1900-01-01.log": EOL
      }
    });

    sut.logMessage("info", "hello world", () => {}, false, () => {
      expect(existsSync(`${sut.LOG_FOLDER}/info.01`)).to.be.true;
    });
  });

  it("Logs an info message", function() {
    mockFs({
      [sut.LOG_FOLDER]: {}
    });

    sut.logSync(["hello world 5"]);

    expect(
      readFileSync(`${sut.LOG_FOLDER}/info.${flooredDate}.log`, {
        encoding: "utf8"
      })
    ).to.match(
      /\w{3}, \d{0,2} \w{3} \d{4} \d{2}:\d{2}:\d{2} \w{3} - hello world 5/gm
    );

    mockFs.restore();
  });

  it("Silently logs an info message", function() {
    mockFs({
      [sut.LOG_FOLDER]: {}
    });

    sinon.spy(mockUtils.consoleLog, "info");

    sut.logSync(["hello world"], true);

    expect(mockUtils.consoleLog.info.called).to.equal(false);

    mockFs.restore();
  });

  it("Asynchronously logs an info message", function() {
    mockFs({
      [sut.LOG_FOLDER]: {}
    });

    sut.log(["hello world"], () => {
      expect(
        readFileSync(`${sut.LOG_FOLDER}/info.${flooredDate}.log`, {
          encoding: "utf8"
        })
      ).to.match(
        /\w{3}, \d{0,2} \w{3} \d{4} \d{2}:\d{2}:\d{2} \w{3} - hello world/gm
      );

      mockFs.restore();
    });
  });

  it("Logs an error message", function() {
    mockFs({
      [sut.LOG_FOLDER]: {}
    });

    sut.errorSync(["hello world"]);

    expect(
      readFileSync(`${sut.LOG_FOLDER}/error.${flooredDate}.log`, {
        encoding: "utf8"
      })
    ).to.match(
      /\w{3}, \d{0,2} \w{3} \d{4} \d{2}:\d{2}:\d{2} \w{3} - hello world/gm
    );

    mockFs.restore();
  });

  it("Silently logs an error message", function() {
    mockFs({
      [sut.LOG_FOLDER]: {}
    });

    sinon.spy(mockUtils.consoleLog, "error");

    sut.errorSync(["hello world"], true);

    expect(mockUtils.consoleLog.error.called).to.equal(false);

    mockFs.restore();
  });

  it("Asynchronously logs an error message", function() {
    mockFs({
      [sut.LOG_FOLDER]: {}
    });

    sut.error(["hello world"], () => {
      expect(
        readFileSync(`${sut.LOG_FOLDER}/error.${flooredDate}.log`, {
          encoding: "utf8"
        })
      ).to.match(
        /\w{3}, \d{0,2} \w{3} \d{4} \d{2}:\d{2}:\d{2} \w{3} - hello world/gm
      );

      mockFs.restore();
    });
  });

  it("Logs a warning message", function() {
    const consoleWarn = console.warn;
    console.warn = function() {};

    mockFs({
      [sut.LOG_FOLDER]: {}
    });

    sut.warnSync(["hello world"]);
    expect(
      readFileSync(`${sut.LOG_FOLDER}/warn.${flooredDate}.log`, {
        encoding: "utf8"
      })
    ).to.match(
      /\w{3}, \d{0,2} \w{3} \d{4} \d{2}:\d{2}:\d{2} \w{3} - hello world/gm
    );
    mockFs.restore();
    console.warn = consoleWarn;
  });

  it("Silently logs a warning message", function() {
    mockFs({
      [sut.LOG_FOLDER]: {}
    });

    sinon.spy(console, "warn");

    sut.warnSync(["hello world"], true);

    expect(console.warn.called).to.equal(false);

    mockFs.restore();
  });

  it("Asynchronously logs an warning message", function() {
    mockFs({
      [sut.LOG_FOLDER]: {}
    });

    sut.warn(["hello world"], () => {
      expect(
        readFileSync(`${sut.LOG_FOLDER}/warn.${flooredDate}.log`, {
          encoding: "utf8"
        })
      ).to.match(
        /\w{3}, \d{0,2} \w{3} \d{4} \d{2}:\d{2}:\d{2} \w{3} - hello world/gm
      );

      mockFs.restore();
    });
  });

  it("Shows recent messages", function() {
    mockFs({
      [sut.LOG_FOLDER]: {}
    });

    appendFileSync(`${sut.LOG_FOLDER}/recent.log`, "Message 9" + EOL);
    appendFileSync(`${sut.LOG_FOLDER}/recent.log`, "Message 8" + EOL);
    appendFileSync(`${sut.LOG_FOLDER}/recent.log`, "Message 7" + EOL);
    appendFileSync(`${sut.LOG_FOLDER}/recent.log`, "Message 6" + EOL);
    appendFileSync(`${sut.LOG_FOLDER}/recent.log`, "Message 5" + EOL);
    appendFileSync(`${sut.LOG_FOLDER}/recent.log`, "Message 4" + EOL);
    appendFileSync(`${sut.LOG_FOLDER}/recent.log`, "Message 3" + EOL);
    appendFileSync(`${sut.LOG_FOLDER}/recent.log`, "Message 2" + EOL);
    appendFileSync(`${sut.LOG_FOLDER}/recent.log`, "Message 1" + EOL);
    appendFileSync(`${sut.LOG_FOLDER}/recent.log`, "Message 0" + EOL);

    const recentLog = sut.showRecent(5);

    expect(recentLog).to.equal(
      `Message 5${EOL}Message 6${EOL}Message 7${EOL}Message 8${EOL}Message 9`
    );

    mockFs.restore();
  });
});
