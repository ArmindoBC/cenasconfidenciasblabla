app.service('UserRepository', ["RequestService", function(RequestService) {

    /*
        Access user list. It can receive a set of properties to filter results like  id, subject, new, pinned and userId properties
    */
    this.GetUserList = function(authToken, params){
        return RequestService.GetFalcorModel().call("user.list", [params, authToken])
        .then(function(value){
            return value.json.user.list;
        })
    }
    /*
        Access only one user by its id property
    */
    this.GetUserById = function(authToken, id){
        return RequestService.GetFalcorModel(authToken).get(["user",[id]])
        .then(function(value){
            return value.json.user;
        })
    }

    /*
        Update an user entity. It receives a set of params like id(required)
        and other optional properties like fullName, nif, phone, address, birthDate
    */
    this.UpdateUser = function(authToken,params){
        return RequestService.GetFalcorModel().call("user.update",[params, authToken])
        .then(function(res){
            return res.json.user;
        })
    }


}]);
