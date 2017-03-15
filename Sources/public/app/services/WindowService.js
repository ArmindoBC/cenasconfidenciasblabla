"use strict";
app.service('WindowService', ["$http", function() {

  this.InDesktopMode = function() {
    return $("#ResponsiveHelpPanelDesktop").css("display") !== "none";
  };

  this.InTabletLandscapeMode = function() {
    return $("#ResponsiveHelpTabletLandscape").css("display") !== "none";
  };

  this.InTabletPortraitMode = function() {
    return $("#ResponsiveHelpTabletPortrait").css("display") !== "none";
  };

  this.InMobileLandscapeMode = function() {
    return $("#ResponsiveHelpMobileLandscape").css("display") !== "none";
  };

  this.InMobilePortraitMode = function() {
    return $("#ResponsiveHelpMobilePortrait").css("display") !== "none";
  };

}]);
