"use strict";
app.controller('NotificationsController', ["$scope", "$timeout", "NotificationRepository", 'UserService', function($scope, $timeout, NotificationRepository, UserService) {

	//Initialize LogClient()
	var logClient = new LogClient(); //jshint ignore:line
	//Notify NoficationsController.js was started
	logClient.SendLog({
		level: 'TRACE',
		category: "information",
		message: "NotificationsController started"
	});

	//notifications list
	$scope.notifications = [];
	//pinned filter state
	$scope.filterPinned = false;
	//filter options
	$scope.filterOptions = [
		{value : "date", text : "Date"},
		{value : "enableReminder", text : "Reminder"},
		{value : "enableUnread", text : "Unread"},
	];
	//selected filter
	$scope.filterSelect = $scope.filterOptions[0];
	$scope.dateSort = "enableNew";
	$scope.showSortOptions = false;

	//change pinned option, filtering notifications by their pinned state
	$scope.toogleFilterPinned = function (state){
		$scope.filterPinned = state;
		$scope.showSortOptions = false;
	}

	//change notification pinned state
	$scope.tooglePinned = function(notification){
		return NotificationRepository.UpdateNotification(UserService.SessionToken, {id:notification.id, pinned:!notification.pinned})
		.then(function(updatedNotification){
			notification.pinned = updatedNotification.pinned;
			$scope.$apply();
		})
	}

	//on notifications blur hide options menu
	$scope.notificationsBlur = function(){
		$scope.showSortOptions = false;
	}

	//show and hide sort/filter options menu
	$scope.toogleSortOptions = function(){
		$scope.showSortOptions = !$scope.showSortOptions;
	}

	//it changes the notifications filter option and hides the select menu
	$scope.changeFilter = function(filter){
		$scope.filterSelect = filter;
		$scope.showSortOptions = false;
	}

	//it changes the date sort order and hides the select menu
	$scope.changeDateSort = function(dateSort){
		$scope.dateSort = dateSort;
		$scope.showSortOptions = false;
	}

	//Get all notifications for the user logged
	$scope.getNotificationsList = function() {
		return NotificationRepository.GetNotificationList(UserService.SessionToken, {userId : UserService.CurrentUser.id})
		.then( function(result) {
			return result;
		} );
	};

	//Show/Hide notification details
	$scope.notificationDetails = function( notification ) {
		if(notification.showDetails) {
			notification.showDetails = false;
		} else {
			notification.showDetails = true;

			//if the notifications was new (not yet visited by the user)
			// it updates its state in order to make it not new ( read )
			if(notification.new){
				return NotificationRepository.UpdateNotification(UserService.SessionToken, {id:notification.id, new:false})
				.then(function(updatedNotification){
					notification.new = updatedNotification.new;
					$scope.$apply();
				})
			}
		}



	};

	//initialize needed data for the notifications screen before it was loaded
	//it accesses the notifications list and initializes the scroolbar for the notifications
	$scope.init = function(){
		return $scope.getNotificationsList()
		.then(function(notifications){
			$scope.notifications = notifications;

			$('#notificationListWrapper').perfectScrollbar();

			$timeout(function () {
				$('#notificationListWrapper').perfectScrollbar("update");
				$scope.$apply();
			}, 100, false);

			$scope.$apply();
			return;
		})
	}
	$scope.init();

}]);
