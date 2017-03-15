app.service('NotificationRepository', ["RequestService", function(RequestService) {

    /*
        Access notification list. It can receive a set of properties to filter results like  id, subject, new, pinned and userId properties
    */
    this.GetNotificationList = function(authToken, params){
        return RequestService.GetFalcorModel().call("notification.list", [params, authToken])
        .then(function(value){
            return value.json.notification.list;
        })
    }
    /*
        Access only one notification by its id property
    */
    this.GetNotificationById = function(authToken, id){
        return RequestService.GetFalcorModel(authToken).get(["notification",[id]])
        .then(function(value){
            return value.json.notification;
        })
    }
    /*
        Update a notification entity. It receives a set of params like id(required)
        and other optional properties like subject, text new and pinned in order to update notification value
    */
    this.UpdateNotification = function(authToken,params){
        return RequestService.GetFalcorModel().call("notification.update",[params, authToken])
        .then(function(res){
            return res.json.notification;
        })
    }
    /*
        It updates a notification in order to make its new property false. It is a
        special case of update that must be only used to mark a mesage as read
    */
    this.ReadNotification = function(authToken,notificationId){
        var params ={
            id: notificationId,
            new: false
        }
        return RequestService.GetFalcorModel().call("notification.update",[params, authToken])
        .then(function(res){
            return res.json.notification;
        })
    }
    /*
        It creates a new notification on system. Must receive parameter with subject,
        text and the id of the user (userId) who is the target of the notification
    */
    this.SaveNotification = function(authToken,params){
        return RequestService.GetFalcorModel().call(["notification", "save"], [params, authToken])
        .then(function(res){
            return res.json.notification
        })
    }

}]);
