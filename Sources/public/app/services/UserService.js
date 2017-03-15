"use strict";
//User Service
//it handles all methods and properties about the user
app.service('UserService', ["$location", "$localStorage","$sessionStorage","$http","UserRepository", "$window", function($location, $localStorage,$sessionStorage, $http,UserRepository, $window) {

    this.CurrentUser = $sessionStorage.userData || $localStorage.userData ;
    this.SessionToken = $sessionStorage.sessionToken || $localStorage.sessionToken;
    this.Remember = $localStorage.remember || false;
    var Service = this;


    //it returns a boolean attending user admin role
    this.IsAdmin = function(){
        return Service.CurrentUser && Service.CurrentUser.roles.admin ? true : false;
    }

    //it returns a boolean attending user is currently logged or not
    this.IsLogged = function(){
        return Service.SessionToken ? true : false;
    }

    //it changes the remember state of the user session
    //whith this property set to true, the user can close their tab/browser windows and their session will persist
    //if remember equals to false user will lose the session when their page is closed
    this.SetRemember = function(remember){
        Service.Remember = remember;
        $localStorage.remember = remember;
    }
    //access social data after log in with a social account
    //it stores un CurrentUser field the current user data
    this.getSocialData = function() {
        return $http.get('/api/me')
        .then(function(res) {
            Service.CurrentUser = res.data;
            return Service.CurrentUser;
        })
    }
    //it does a social login with some providers like facebook, linkedin and google.
    //it opens a popup in order to the user insert its credentials and after that
    //it accesses the current user information storing it in session storage and in Service
    this.SocialLogin = function(provider, remember){
        var authClient = new AuthClient();
        //open a popup with provider authentication window
        return authClient.openPopup(provider)
        .then(function(res){
            return Service.getSocialData();
        })
        .then(function(socialUser) {
            //calls backend in order to log in with social account data
            return authClient.SocialLogin(provider, socialUser);
        })
        .then(Service.HandleAuthentication)
        .then(Service.StoreUserData);
    }

    //it creates a new user account. it receives user information like email, username
    // and password and creates a new user account attending those data
    this.Signup = function(newUser, remember){
        Service.Remember = remember;
        var authClient = new AuthClient();

        //it sends new user information to the backend and creates a new entity
        //it also creates a new session, so the user is automatically logged in
        return authClient.Signup(newUser)
        .then(Service.HandleAuthentication)
        .then(Service.StoreUserData);
    }

    //it receives user credentials and do all the process in order to create a new user session
    this.Login = function(loginUser, remember){
        Service.Remember = remember;
        var authClient = new AuthClient();

        //it sends the user credentials to the backend and creates a new user session
        return authClient.Login(loginUser)
        .then(Service.HandleAuthentication)
        .then(Service.StoreUserData);
    }

    //handles social login, local login and signup responses storing the session
    //token and calling auth client in order to access current user data
    this.HandleAuthentication = function(res) {
        if(res.success){
            //store session token in session/local storage and Service data
            if(Service.Remember){
                $localStorage.sessionToken = res.userSession.token;
            }
            else{
                $sessionStorage.sessionToken = res.userSession.token;
            }
            Service.SessionToken = res.userSession.token;

            //access current user data using session token
            var authClient = new AuthClient(Service.SessionToken);
            return authClient.CurrentUser();

        }
        else{
            if(res.errors){
                var message = res.errors.join(',');
                throw new Error(message);
            }
            if(res.errfor){
                var message = JSON.stringify(res.errfor);
                throw new Error(message);
            }

        }
    };

    //stores user data in session storage and Service data
    this.StoreUserData = function(userDataResponse){
        if(userDataResponse){
            //store user data in session/local storage and Service data

            if(Service.Remember){
                $localStorage.userData = userDataResponse.user;
            }
            else{
                $sessionStorage.userData = userDataResponse.user;
            }
            Service.CurrentUser = userDataResponse.user;

            return Service.LoadSpecificData();
        }
        return;
    }

    //it accesses specific user data and merges it with data from user management system.
    //user management system only stores general data, all user data related with the application context are
    //stored in backend application
    this.LoadSpecificData = function(){

        if(!Service.IsAdmin()){
            return UserRepository.GetUserById(this.SessionToken, this.CurrentUser._id)
            .then(function(userData){
                Service.CurrentUser = angular.extend({}, Service.CurrentUser, userData);
                if(Service.Remember){
                    $localStorage.userData = Service.CurrentUser;
                }
                else{
                    $sessionStorage.userData = Service.CurrentUser;
                }
                return;
            });
        }
        else{
            return;
        }

    }

    //It clears all user session data stored in session storages and in localstorage
    //and sends a request to the backend in order to invalidate the session token
    this.Logout = function(){
        var authClient = new AuthClient();

        return authClient.Logout(Service.SessionToken)
        .then(function(){
            $localStorage.sessionToken = undefined;
            $localStorage.userData = undefined;
            $sessionStorage.sessionToken = undefined;
            $sessionStorage.userData = undefined;
            $localStorage.remember = undefined
            Service.CurrentUser = undefined;
            Service.SessionToken = undefined;
            Service.Remember = undefined;
            return;
        });
    }

    //it changes current user data
    this.SetCurrentUser = function(data){
        $localStorage.userData = data;
        $sessionStorage.userData = data;
        Service.CurrentUser = data;
    }
    //acesesses profile image of the logged User
    //it searches through social data to find an profile image url
    this.ProfileImage = function(){
        if(Service.CurrentUser.google){
            return Service.CurrentUser.google.profile.photos[0].value;
        }
        else if(Service.CurrentUser.facebook){
            
            return Service.CurrentUser.facebook.profile.photos[0].value;
        }
        else if(Service.CurrentUser.linkedin && Service.userData.linkedin.profile._json.pictureUrl){
            return Service.CurrentUser.linkedin.profile._json.pictureUrl;
        }
        else{
            return undefined;
        }
    }

    this.ProfileImageLarge = function(){
        if(Service.CurrentUser.google){
            return Service.CurrentUser.google.profile.photos[0].value;
        }
        else if(Service.CurrentUser.facebook){

            var id = Service.CurrentUser.facebook.profile.id;

            var picSite =  'https://graph.facebook.com/' + id+'/picture?type=large';

            return picSite;
        }
        else if(Service.CurrentUser.linkedin && Service.userData.linkedin.profile._json.pictureUrl){
            return Service.CurrentUser.linkedin.profile._json.pictureUrl;
        }
        else{
            return undefined;
        }
    }

    //returns the full name of the logged user.
    // it will search data from social accounts and if no data were found it retrieves the username
    this.FullName = function(){
        if(!this.CurrentUser){
            return
        }

        if(this.CurrentUser.fullName){
            return this.CurrentUser.fullName;
        }
        else if(this.CurrentUser.google){
            return this.CurrentUser.google.profile.displayName;
        }
        else if(this.CurrentUser.facebook){
            return this.CurrentUser.facebook.profile.displayName;
        }
        else if(this.CurrentUser.linkedin){
            return this.CurrentUser.linkedin.profile.displayName;
        }
        else{
            return this.CurrentUser.username;
        }
    }

    //returns the first name of the logged user.
    // it will search data from social accounts and if no data were found it retrieves the username


    this.FirstName = function(){
        if(this.CurrentUser.firstName){
            return this.CurrentUser.fullName.split(' ')[0];
        }
        else if(this.CurrentUser.google){
            return this.CurrentUser.google.profile.displayName.split(' ')[0];
        }
        else if(this.CurrentUser.facebook){
            return this.CurrentUser.facebook.profile.displayName.split(' ')[0];
        }
        else if(this.CurrentUser.linkedin){
            return this.CurrentUser.linkedin.profile.displayName.split(' ')[0];
        }
        else{
            return this.CurrentUser.username;
        }
    }
}]);
