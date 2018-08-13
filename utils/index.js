"use strict";

module.exports = {
  consoleLog: {
    info: function() {
      console.log.apply(console, arguments);
    },

    error: function() {
      console.error.apply(console, arguments);
    }
  }
};
