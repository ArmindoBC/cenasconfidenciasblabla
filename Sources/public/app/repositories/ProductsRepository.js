app.service('ProductsRepository', ["RequestService", function(RequestService) {
  var logClient = new LogClient();

  /*
  * Request products
  */
  this.GetProductsByUserData = function(userInfoData) {
      logClient.SendLog({
          level:'DEBUG',
          category : "information",
          message :"products route from Middleware called"
      });


      return RequestService.GetFalcorModel().call("products.getListByUserInfo", [userInfoData])
      .then(function(value) {
          logClient.SendLog({
              level:'DEBUG',
              category : "information",
              message :"data received from Middleware products route"
          });
          return(value.json);
      })
      .catch(function(err){
          console.log(err)
          logClient.SendLog({
              level:'ERROR',
              category : "information",
              message :"products route from Middleware retrieved an error: " + err.message
          });
          return false;
      });
  };

  /*
  * Request products by ids.
    It receives an array with ids and receives products data for each product
  */
  this.GetProductsByIDs = function(ids) {
      logClient.SendLog({
          level:'DEBUG',
          category : "information",
          message :"products route from Middleware called"
      });

      /*
      * Request products
      */

      return RequestService.GetFalcorModel().call("products.getListByIDs", [ids])
      .then(function(value) {
          logClient.SendLog({
              level:'DEBUG',
              category : "information",
              message :"data received from Middleware products route"
          });
          return(value.json.products);
      })
      .catch(function(err){
          console.log(err)
          logClient.SendLog({
              level:'ERROR',
              category : "information",
              message :"products route from Middleware retrieved an error: " + err.message
          });
          return false;
      });
  };


    this.productsID = {
        content: "000000000000000000000001",
        motor: "000000000000000000000002",
        workers: "000000000000000000000003"
    }

}]);
