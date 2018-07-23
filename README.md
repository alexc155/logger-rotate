[![Build Status](https://travis-ci.org/alexc155/logger-rotate.svg?branch=master)](https://travis-ci.org/alexc155/logger-rotate)
[![Coverage Status](https://coveralls.io/repos/github/alexc155/logger-rotate/badge.svg?branch=master)](https://coveralls.io/github/alexc155/logger-rotate?branch=master)
[![dependencies Status](https://david-dm.org/alexc155/logger-rotate/status.svg)](https://david-dm.org/alexc155/logger-rotate)
[![devDependencies Status](https://david-dm.org/alexc155/logger-rotate/dev-status.svg)](https://david-dm.org/alexc155/logger-rotate?type=dev)

# logger-rotate

Log messages to files that are rotated on a schedule.

The three methods `console.log`, `console.warn`, and `console.error` can be swapped out for either synchronous or asynchronous logger-rotate equivalent methods.

Separate files for the three levels of logging are stored and rotated for new empty files daily.

A history of older log files is available.

## Installation

```
$ npm install logger-rotate --save
```

Optional - Set the path where logs should be stored. Eiher relative or absolute:

```
$ node ./node_modules/logger-rotate/index.js setLogFolder ../../logs
```

## Usage

```
var logger = require("logger-rotate");

logger.logSync("Hello World");

logger.warnSync("Warning!!!");

logger.errorSync("Game Over!");

logger.log("Hello World", () => {
    console.log(":-)");
  });

logger.warn("Warning!!!", () => {
    console.warn(":-|");
  });

logger.error("Game Over!", () => {
    console.error(":-(");
  });
```

## Tests

npm test

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality. Lint and test your code.

## Release History

- 0.1.0 Initial release.
- 0.2.1 Ability to set log folder & fixed log rotation bug.
