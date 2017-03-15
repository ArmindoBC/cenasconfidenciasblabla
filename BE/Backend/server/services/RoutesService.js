"use strict";

/**
 * Routes Service: Build and check requirements for routings.
 */

class RoutesService {

  constructor() {}

  BuildRoutes() {
    console.log("Building Routes...");
    this.AllRoutes = [];
    this.ConcatRoutes(this.BuildProductRoutes());
    this.ConcatRoutes(this.BuildCoverageRoutes());
    this.ConcatRoutes(this.BuildPolicyRoutes());
    this.ConcatRoutes(this.BuildAuthRoutes());
    this.ConcatRoutes(this.BuildNotificationRoutes());
    this.ConcatRoutes(this.BuildUserRoutes());

    console.log("Routes Build!");

    //Register Routes on Server
    return this.AllRoutes;
  }

  ConcatRoutes(newRoutes) {
    this.AllRoutes = [].concat(this.AllRoutes, newRoutes);
  }
  //Bundle Routes
  BuildPolicyRoutes() {
    console.log("Policy Routes...");
    var Policy = require('../controllers/PolicyController.js');
    var PolicyRoutes = [];
    PolicyRoutes.push(Policy.Create());
    PolicyRoutes.push(Policy.Update());
    PolicyRoutes.push(Policy.Get());
    return PolicyRoutes;
  }

  //Group Coverage Routes
  BuildProductRoutes() {
    console.log("GroupCoverage Routes...");
    var GroupCoverage = require('../controllers/ProductController.js');
    var GroupCoverageRoutes = [];
    GroupCoverageRoutes.push(GroupCoverage.Get());
    GroupCoverageRoutes.push(GroupCoverage.GetItem());
    return GroupCoverageRoutes;
  }
  //Coverage Routes
  BuildCoverageRoutes() {
    console.log("Coverages Routes...");
    var Coverage = require('../controllers/CoverageController.js');
    var CoverageRoutes = [];
    CoverageRoutes.push(Coverage.Get());
    return CoverageRoutes;
  }
  //Authorization Routes
  BuildAuthRoutes(){
      console.log("Coverages Routes...");
      var Auth = require('../controllers/AuthController.js');
      var AuthRoutes = [];
      AuthRoutes.push(Auth.Logout());
      AuthRoutes.push(Auth.Authorize());
      AuthRoutes.push(Auth.Login());
      AuthRoutes.push(Auth.LoginAD());
      AuthRoutes.push(Auth.Signup());
      AuthRoutes.push(Auth.SocialLogin());
      AuthRoutes.push(Auth.CurrentUser());
      return AuthRoutes;
  }
  BuildNotificationRoutes() {
      console.log("Notification Routes...");
      var Notification = require('../controllers/NotificationController.js');
      var NotificationRoutes = [];
      NotificationRoutes.push(Notification.Get());
      NotificationRoutes.push(Notification.GetItem());
      NotificationRoutes.push(Notification.Post());
      NotificationRoutes.push(Notification.Patch());
      NotificationRoutes.push(Notification.Delete());
      return NotificationRoutes;
  }
  BuildUserRoutes() {
    console.log("User Routes...");
    var User = require('../controllers/UserController.js');
    var UserRoutes = [];
    UserRoutes.push(User.Get());
    UserRoutes.push(User.GetItem());
    UserRoutes.push(User.Post());
    UserRoutes.push(User.Patch());
    return UserRoutes;
  }

}
module.exports = new RoutesService();
