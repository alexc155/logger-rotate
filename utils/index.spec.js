"use strict";

const { expect } = require("chai");
const sinon = require("sinon");

const sut = require("./");

describe("#utils", function() {
  it("logs info messages", function() {
    sinon.stub(console, "log");

    sut.consoleLog.info("INFO");

    expect(console.log.calledWith("INFO")).to.equal(true);

    console.log.restore();
  });

  it("logs error messages", function() {
    sinon.stub(console, "error");

    sut.consoleLog.error("ERROR");

    expect(console.error.calledWith("ERROR")).to.equal(true);

    console.error.restore();
  });
});
