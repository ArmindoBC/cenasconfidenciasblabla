"use strict";
var utils = require("./utils.js"),
  bundle = require("./controllers/BundleController.js"),
  user = require("./controllers/UserController.js"),
  coverage = require("./controllers/CoverageController.js"),
  coverageQuestion = require("./controllers/CoverageQuestionController.js"),
  groupCoverage = require("./controllers/GroupCoverageController.js"),
  groupCoverageQuestion = require("./controllers/GroupCoverageQuestionController.js"),
  questionType = require("./controllers/QuestionTypeController.js");

var path;

//create the path where the log files will be created - backend_testing_<date>_<hour>
path = utils.CreateLogsFile();

//start the tests for all the controllers
user.startTest(path);
coverage.startTest(path);
coverageQuestion.startTest(path);
groupCoverage.startTest(path);
groupCoverageQuestion.startTest(path);
questionType.startTest(path);
bundle.startTest(path);
