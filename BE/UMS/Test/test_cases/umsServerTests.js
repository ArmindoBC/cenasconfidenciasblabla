var request = require('request-promise');

var database = require('../database/database');
var helper = require('../helpers/file');

exports = module.exports = function(configs, serverConfigs, testingData, context){
    return {

        //========= SignUp Tests
        /*
        It tests if signup operation succeeds when receives data about an non existing username
        Operation must succeeds
        */
        TestLocalSignUpSuccess : function(){

            var testData = {
                id: `#${++helper.testCounter}`,
                title: 'Testing Local Sign Up',
                context: context,
                description: 'Success test: with non existing user data',
                input:{
                    username: testingData.newlocalAccount.username,
                    email: testingData.newlocalAccount.email,
                    password: testingData.newlocalAccount.password
                }
            };
            return request({
                method: 'POST',
                uri: `http://${serverConfigs.host}:${serverConfigs.port}${serverConfigs.paths.signUp}`,
                json: true,
                body: testData.input
            }).then((res) => {
                testData.output = res;
                if(res.success){
                    testData.result = 'PASSED';
                }
                else{
                    testData.result = 'FAILED';
                }
                helper.PrintDetailedResult(testData);
                return;
            })
            .catch((err) => {
                testData.output = res;
                testData.output = err;
                helper.PrintDetailedResult(testData);
                return;
            });

        },

        /*
        It tests if signup operation succeeds and if it produces the insertion of a new
        user instance on database. After signup a user it queries database searching for
        the new user
        Operation must succeeds
        */
        TestLocalSignUpSuccess2 : function(){
            var testData = {
                id: `#${++helper.testCounter}`,
                title: 'Testing Local Sign Up',
                context: context,
                description: 'Success test: check if created user exists on database',
                input:{
                    username: testingData.newlocalAccount.username,
                    email: testingData.newlocalAccount.email,
                }
            };
            return database.UsersModel.findOne({
                username : testData.input.username
            })
            .then( (user) => {
                if(user){
                    testData.output = user;
                    testData.result = 'PASSED';
                }
                else{
                    testData.output = user;
                    testData.result = 'FAILED';
                }
                helper.PrintDetailedResult(testData);
                return;
            })
            .catch( (err) => {
                testData.output = err;
                testData.result = 'FAILED';
                helper.PrintDetailedResult(testData);
            });

        },

        /*
        It tests if signup operation fails when client tries to signup a new user with data
        like email and username that already exists on system
        Operation must fail
        */
        TestLocalSignUpFailure1 : function(){
            var testData = {
                id: `#${++helper.testCounter}`,
                title: 'Testing Local Sign Up',
                context: context,
                description: 'Failure test: with already existing user data.',
                input:{
                    username: testingData.existingAccount.username,
                    email: testingData.existingAccount.email,
                    password: testingData.existingAccount.password
                }
            };

            return request({
                method: 'POST',
                uri: `http://${serverConfigs.host}:${serverConfigs.port}${serverConfigs.paths.signUp}`,
                json: true,
                body: testData.input
            }).then((res) => {
                testData.output = res;
                if(res.success){
                    testData.result = 'FAILED';
                }
                else{
                    testData.result = 'PASSED';
                }
                helper.PrintDetailedResult(testData);
                return;
            })
            .catch((err) => {
                testData.output = err;
                testData.result = 'FAILED';
                helper.PrintDetailedResult(testData);
                return;
            });
        },

        /*
        It tests if signup operation fails when client tries to signup a new user
        without providing necessary data.
        Operation must fail
        */
        TestLocalSignUpFailure2 : function(){
            var testData = {
                id: `#${++helper.testCounter}`,
                title: 'Testing Local Sign Up',
                context: context,
                description: 'Failure test: without necessary data.',
                input:{}
            };

            return request({
                method: 'POST',
                uri: `http://${serverConfigs.host}:${serverConfigs.port}${serverConfigs.paths.signUp}`,
                json: true,
                body: testData.input
            }).then((res) => {
                testData.output = res;
                if(res.success){
                    testData.result = `FAILED`;
                }
                else{
                    testData.result = `PASSED`;
                }
                helper.PrintDetailedResult(testData);
                return;
            })
            .catch((err) => {
                testData.output = err;
                testData.result = `PASSED`;
                helper.PrintDetailedResult(testData);
                return;
            });
        },



        //========== Login Tests =================================

        /*
        It checks if a login operation succeeds with valid credentials.
        */
        TestLocalLoginSuccess : function(){

            var testData = {
                id: `#${++helper.testCounter}`,
                title: 'Testing Local Login',
                context: context,
                description: 'Success test: with existing credentials.',
                input:{
                    username: testingData.existingAccount.username,
                    password: testingData.existingAccount.password
                }
            };

            return request({
                method: 'POST',
                uri: `http://${serverConfigs.host}:${serverConfigs.port}${serverConfigs.paths.login}`,
                json: true,
                body: testData.input
            }).then((res) => {
                testData.output = res;
                if(res.success){
                    testData.result = 'PASSED';
                }
                else{
                    testData.result = 'FAILED';
                }
                helper.PrintDetailedResult(testData);
                return;
            })
            .catch((err) => {
                testData.output = err;
                testData.result = 'FAILED';
                helper.PrintDetailedResult(testData);
                return;
            });

        },

        /*
        It checks if a login operation generates a valid user session on database.
        It must create an user session in which the expiration date is greater than current time
        */
        TestLocalLoginSuccess2 : function(){

            var testData = {
                id: `#${++helper.testCounter}`,
                title: 'Testing Local Login',
                context: context,
                description: 'Success test: check if generated session is valid.',
                input:{
                    username: testingData.existingAccount.username,
                    password: testingData.existingAccount.password
                }
            };

            //make login request
            return request({
                method: 'POST',
                uri: `http://${serverConfigs.host}:${serverConfigs.port}${serverConfigs.paths.login}`,
                json: true,
                body: testData.input
            }).then((res) => {
                testData.output = res;
                if(res.success){
                    //login successful
                    //find user session
                    return database.UserSessionModel.findOne({token: res.userSession.token})
                    .then((userSession) => {
                        testData.output = userSession;
                        //test validity

                        if(userSession.toObject().expirationDate > Date.now()){
                            testData.result = 'PASSED';
                            helper.PrintDetailedResult(testData);
                            return;
                        }
                        else{
                            testData.result = 'FAILED';
                            helper.PrintDetailedResult(testData);
                            return;
                        }
                    })
                }
                else{
                    //login failed
                    testData.result = 'FAILED';
                    helper.PrintDetailedResult(testData);
                    return;
                }
            })
            .catch((err) => {
                testData.output = err;
                testData.result = 'FAILED';
                helper.PrintDetailedResult(testData);
                return;
            });

        },

        /*
        It tries to login without credentials.
        Operation must fail.
        */
        TestLocalLoginFailure : function(){
            var testData = {
                id: `#${++helper.testCounter}`,
                title: 'Testing Local Login',
                context: context,
                description: 'Failure test: without username and password.',
                //without credentials
                input:{}
            };
            return request({
                method: 'POST',
                uri: `http://${serverConfigs.host}:${serverConfigs.port}${serverConfigs.paths.login}`,
                json: true,
                body: testData.input
            }).then((res) => {
                testData.output = res;
                if(res.success){
                    testData.result = 'FAILED';
                }
                else{
                    testData.result = 'PASSED';
                }
                helper.PrintDetailedResult(testData);
            })
            .catch((err) => {
                testData.output = err;
                testData.result = 'FAILED';
                helper.PrintDetailedResult(testData);
            });

        },

        /*
        It tries to login with bad credentials.
        Operation must fail.
        */
        TestLocalLoginFailure2 : function(){
            var testData = {
                id: `#${++helper.testCounter}`,
                title: 'Testing Local Login',
                context: context,
                description: 'Failure test: bad password',
                input:{
                    username: testingData.existingAccount.username,
                    password: testingData.existingAccount.password + '--'
                }
            };
            return request({
                method: 'POST',
                uri: `http://${serverConfigs.host}:${serverConfigs.port}${serverConfigs.paths.login}`,
                json: true,
                body: testData.input
            }).then((res) => {
                testData.output = res;
                if(res.success){
                    testData.result = 'FAILED';
                }
                else{
                    testData.result = 'PASSED';
                }
                helper.PrintDetailedResult(testData);
                return;
            })
            .catch((err) => {
                testData.result = 'FAILED';
                helper.PrintDetailedResult(testData);
                return;
            });

        },

        //=========Logout Tests ================================

        /*
        It checks if a logout succeeds.
        It makes a login request and catch the user session token in order to do logout
        with received token.
        Operation must succeed
        */
        TestLogoutSuccess : function(){

            var testData = {
                id: `#${++helper.testCounter}`,
                title: 'Testing Logout',
                context: context,
                description: 'Success test: with a valid user session token',
                input:{
                    username: testingData.existingAccount.username,
                    password: testingData.existingAccount.password
                }
            };

            return request({
                method: 'POST',
                uri: `http://${serverConfigs.host}:${serverConfigs.port}${serverConfigs.paths.login}`,
                json: true,
                body: testData.input
            }).then((res) => {
                testData.output = res;
                if(res.success){
                    var userSessionToken = res.userSession.token;
                    testData.input.sessionToken = userSessionToken;
                    return request({
                        method: 'POST',
                        uri: `http://${serverConfigs.host}:${serverConfigs.port}${serverConfigs.paths.logout}`,
                        json: true,
                        headers: {Authorization : `Bearer ${testData.input.sessionToken}`}
                    }).then((res) => {
                        testData.output = res;
                        if(res.success){
                            testData.result = 'PASSED';
                        }
                        else{
                            testData.result = 'FAILED';
                        }
                        helper.PrintDetailedResult(testData);
                        return;
                    })
                }
                else{
                    testData.result = 'FAILED';
                }
                helper.PrintDetailedResult(testData);
                return;
            })
            .catch((err) => {
                testData.output = err;
                testData.result = 'FAILED';
                helper.PrintDetailedResult(testData);
                return;
            });

        },

        /*
        It checks if a logout fails.
        It makes a logout request with a non valid authentication token.
        Operation must fails
        */
        TestLogoutFailure : function(){

            var testData = {
                id: `#${++helper.testCounter}`,
                title: 'Testing Logout',
                context: context,
                description: 'Failure test: with an invalid user session token',
                input:{
                    sessionToken: "invalidSessionTokenString",
                }
            };

            return request({
                method: 'POST',
                uri: `http://${serverConfigs.host}:${serverConfigs.port}${serverConfigs.paths.logout}`,
                json: true,
                headers: {
                    Authorization: `Bearer ${testData.input.sessionToken}`
                }
            }).then((res) => {
                testData.output = res;
                testData.result = 'FAILED';
                helper.PrintDetailedResult(testData);
                return;
            })
            .catch((err) => {
                testData.output = err;
                if(err.response.statusCode === 401){
                    testData.output = err.response.body;
                    testData.result = 'PASSED';
                }
                else{
                    testData.result = 'FAILED';
                }
                helper.PrintDetailedResult(testData);
                return;
            });

        },

        /*
        It checks if a logout fails.
        It makes a logout request without an authentication token.
        Operation must fails
        */
        TestLogoutFailure2 : function(){

            var testData = {
                id: `#${++helper.testCounter}`,
                title: 'Testing Logout',
                context: context,
                description: 'Failure test: with an invalid user session token',
                input:{}
            };

            return request({
                method: 'POST',
                uri: `http://${serverConfigs.host}:${serverConfigs.port}${serverConfigs.paths.logout}`,
                json: true,
                headers: {
                    Authorization: `Bearer ${testData.input.sessionToken}`
                }
            }).then((res) => {
                testData.output = res;
                testData.result = 'FAILED';
                helper.PrintDetailedResult(testData);
                return;
            })
            .catch((err) => {
                testData.output = err;
                if(err.response.statusCode === 401){
                    testData.output = err.response.body;
                    testData.result = 'PASSED';
                }
                else{
                    testData.result = 'FAILED';
                }
                helper.PrintDetailedResult(testData);
                return;
            });

        },


        //========== Authorization Tests =================================

        /*
        It checks authorization.
        it makes a login request, receives a session token and uses it in order to
        make an authorize request.
        Test must succeed
        */
        TestAuthorizationSuccess : function(){

            var testData = {
                id: `#${++helper.testCounter}`,
                title: 'Testing Authorization',
                context: context,
                description: 'Success test: with a valid user session token',
                input:{
                    username: testingData.existingAccount.username,
                    password: testingData.existingAccount.password
                }
            };

            return request({
                method: 'POST',
                uri: `http://${serverConfigs.host}:${serverConfigs.port}${serverConfigs.paths.login}`,
                json: true,
                body: testData.input
            }).then((res) => {
                testData.output = res;
                if(res.success){
                    var userSessionToken = res.userSession.token;
                    testData.input.sessionToken = userSessionToken;
                    return request({
                        method: 'POST',
                        uri: `http://${serverConfigs.host}:${serverConfigs.port}${serverConfigs.paths.authorize}`,
                        json: true,
                        headers: {Authorization : `Bearer ${testData.input.sessionToken}`}
                    }).then((res) => {
                        testData.output = res;
                        if(res.success){
                            testData.result = 'PASSED';
                        }
                        else{
                            testData.result = 'FAILED';
                        }
                        helper.PrintDetailedResult(testData);
                        return;
                    })
                }
                else{
                    testData.result = 'FAILED';
                }
                helper.PrintDetailedResult(testData);
                return;
            })
            .catch((err) => {
                testData.output = err;
                testData.result = 'FAILED';
                helper.PrintDetailedResult(testData);
                return;
            });
        },

        /*
        It checks authorization.
        it makes a login request, receives a session token and uses it to make a logout
        request and after that make an authorize request.
        Test must fail
        */
        TestAuthorizationFailure : function(){

            var testData = {
                id: `#${++helper.testCounter}`,
                title: 'Testing Authorization',
                context: context,
                description: 'Failure test: with an expired user session token',
                input:{
                    username: testingData.existingAccount.username,
                    password: testingData.existingAccount.password
                }
            };
            return request({
                method: 'POST',
                uri: `http://${serverConfigs.host}:${serverConfigs.port}${serverConfigs.paths.login}`,
                json: true,
                body: testData.input
            }).then((res) => {
                testData.output = res;
                if(res.success){
                    var userSessionToken = res.userSession.token;
                    testData.input.sessionToken = userSessionToken;
                    return request({
                        method: 'POST',
                        uri: `http://${serverConfigs.host}:${serverConfigs.port}${serverConfigs.paths.logout}`,
                        json: true,
                        headers: {Authorization : `Bearer ${testData.input.sessionToken}`}
                    })
                    .then((res) => {
                        testData.output = res;
                        if(res.success){
                            return request({
                                method: 'POST',
                                uri: `http://${serverConfigs.host}:${serverConfigs.port}${serverConfigs.paths.authorize}`,
                                json: true,
                                headers: {Authorization : `Bearer ${testData.input.sessionToken}`}
                            });
                        }
                        else{
                            testData.result = 'FAILED';
                        }
                        helper.PrintDetailedResult(testData);
                        return;
                    })
                    .then( (res) => {
                        testData.output = res;
                        if(res.success){
                            testData.result = 'FAILED';
                        }
                        else{
                            testData.result = 'PASSED';
                        }
                        helper.PrintDetailedResult(testData);
                        return;
                    })
                    .catch((err) => {
                        testData.output = err;
                        if(err.response.statusCode === 401){
                            testData.output = err.response.body;
                            testData.result = 'PASSED';
                        }
                        else{
                            testData.result = 'FAILED';
                        }
                        helper.PrintDetailedResult(testData);
                        return;
                    });
                }
                else{
                    testData.result = 'FAILED';
                }
                helper.PrintDetailedResult(testData);
                return;
            })
            .catch((err) => {
                testData.output = err;
                testData.result = 'FAILED';
                helper.PrintDetailedResult(testData);
                return;
            });
        },


        /*
        It checks authorization.
        It makes an authorizate request with an invalid user session token
        Operation must fail
        */
        TestAuthorizationFailure2 : function(){

            var testData = {
                id: `#${++helper.testCounter}`,
                title: 'Testing Authorization',
                context: context,
                description: 'Success test: with an invalid user session token',
                input:{
                    sessionToken: "invalidUserSessionToken",
                }
            };

            return request({
                method: 'POST',
                uri: `http://${serverConfigs.host}:${serverConfigs.port}${serverConfigs.paths.authorize}`,
                json: true,
                body: testData.input,
                headers: {Authorization : `Bearer ${testData.input.sessionToken}`}
            }).then((res) => {
                testData.output = res;
                if(res.success){
                    var userSessionToken = res.userSession.token;
                    testData.input.sessionToken = userSessionToken;
                    testData.result = 'FAILED';

                }
                else{
                    testData.result = 'PASSED';
                }
                helper.PrintDetailedResult(testData);
                return;
            })
            .catch((err) => {
                testData.output = err;
                if(err.response.statusCode === 401){
                    testData.output = err.response.body;
                    testData.result = 'PASSED';
                }
                else{
                    testData.result = 'FAILED';
                }
                helper.PrintDetailedResult(testData);
                return;
            });
        },

        /*
        It checks authorization.
        It makes an authorizate request without sending any session token on request
        Operation must fail
        */
        TestAuthorizationFailure3 : function(){

            var testData = {
                id: `#${++helper.testCounter}`,
                title: 'Testing Authorization',
                context: context,
                description: 'Success test: without providing an user session token',
                input:{}
            };

            //make a authorize request without provide user session token
            return request({
                method: 'POST',
                uri: `http://${serverConfigs.host}:${serverConfigs.port}${serverConfigs.paths.authorize}`,
                json: true,
                body: testData.input,
                headers: {Authorization : `Bearer ${testData.input.sessionToken}`}
            }).then((res) => {
                testData.output = res;
                //operation must not succeed in order to pass test
                if(res.success){
                    var userSessionToken = res.userSession.token;
                    testData.input.sessionToken = userSessionToken;
                    testData.result = 'FAILED';

                }
                else{
                    testData.result = 'PASSED';
                }
                helper.PrintDetailedResult(testData);
                return;
            })
            .catch((err) => {
                testData.output = err;
                if(err.response.statusCode === 401){
                    testData.output = err.response.body;
                    testData.result = 'PASSED';
                }
                else{
                    testData.result = 'FAILED';
                }
                helper.PrintDetailedResult(testData);
                return;
            });
        },


        //========== Current User Tests =================================

        /*
        It accesses current user.
        it makes a login request, receives a session token and uses it in order to
        retrive current user information
        Test must succeed
        */
        TestCurrentUserSuccess1 : function(){

            var testData = {
                id: `#${++helper.testCounter}`,
                title: 'Testing Access Current User',
                context: context,
                description: 'Success test: with a valid user session token',
                input:{
                    username: testingData.existingAccount.username,
                    password: testingData.existingAccount.password
                }
            };

            //make a login request with valid credentials
            return request({
                method: 'POST',
                uri: `http://${serverConfigs.host}:${serverConfigs.port}${serverConfigs.paths.login}`,
                json: true,
                body: testData.input
            }).then((res) => {
                testData.output = res;
                if(res.success){
                    var userSessionToken = res.userSession.token;
                    testData.input.sessionToken = userSessionToken;
                    //make a current user request
                    return request({
                        method: 'GET',
                        uri: `http://${serverConfigs.host}:${serverConfigs.port}${serverConfigs.paths.currentUser}`,
                        json: true,
                        headers: {Authorization : `Bearer ${testData.input.sessionToken}`}
                    }).then((res) => {
                        testData.output = res;
                        //operation must succeed
                        if(res.success){
                            testData.result = 'PASSED';
                        }
                        else{
                            testData.result = 'FAILED';
                        }
                        helper.PrintDetailedResult(testData);
                        return;
                    })
                }
                else{
                    testData.result = 'FAILED';
                }
                helper.PrintDetailedResult(testData);
                return;
            })
            .catch((err) => {
                testData.output = err;
                testData.result = 'FAILED';
                helper.PrintDetailedResult(testData);
                return;
            });
        },



        /*
        It accesses current user.
        it makes a login request, receives a session token and uses it in order to
        retrive current user information. After that it requests database in order to find
        an user through username and compare if user id match with current user retrieved
        Test must succeed
        */
        TestCurrentUserSuccess2 : function(){

            var testData = {
                id: `#${++helper.testCounter}`,
                title: 'Testing Access Current User',
                context: context,
                description: 'Success test: with a valid user session token',
                input:{
                    username: testingData.existingAccount.username,
                    password: testingData.existingAccount.password
                }
            };

            //make a login request with valid credentials
            return request({
                method: 'POST',
                uri: `http://${serverConfigs.host}:${serverConfigs.port}${serverConfigs.paths.login}`,
                json: true,
                body: testData.input
            }).then((res) => {
                testData.output = res;
                if(res.success){
                    var userSessionToken = res.userSession.token;
                    testData.input.sessionToken = userSessionToken;
                    //make a current user request
                    return request({
                        method: 'GET',
                        uri: `http://${serverConfigs.host}:${serverConfigs.port}${serverConfigs.paths.currentUser}`,
                        json: true,
                        headers: {Authorization : `Bearer ${testData.input.sessionToken}`}
                    }).then((res) => {
                        testData.output = res;

                        //operation must succeed
                        if(res.success){
                            database.UsersModel.findOne({username: testData.input.username})
                            .then( (user) => {

                                if(user._id.toString() === res.user._id.toString()){
                                    testData.result = 'PASSED';
                                }
                                else{
                                    testData.result = 'FAILED';
                                }
                                helper.PrintDetailedResult(testData);
                                return;
                            })
                        }
                        else{
                            testData.result = 'FAILED';
                        }
                        helper.PrintDetailedResult(testData);
                        return;
                    })
                }
                else{
                    testData.result = 'FAILED';
                }
                helper.PrintDetailedResult(testData);
                return;
            })
            .catch((err) => {
                testData.output = err;
                testData.result = 'FAILED';
                helper.PrintDetailedResult(testData);
                return;
            });
        },


        /*
        It accesses current user.
        it makes a login request, receives a session token and uses it in order to
        make a logout and after that tries to access current user information with
        previous user session token
        Test must fail
        */
        TestCurrentUserFailure1 : function(){

            var testData = {
                id: `#${++helper.testCounter}`,
                title: 'Testing Access Current User',
                context: context,
                description: 'Failure test: with an expired user session token',
                input:{
                    username: testingData.existingAccount.username,
                    password: testingData.existingAccount.password
                }
            };

            //make a login request with valid credentials
            return request({
                method: 'POST',
                uri: `http://${serverConfigs.host}:${serverConfigs.port}${serverConfigs.paths.login}`,
                json: true,
                body: testData.input
            }).then((res) => {
                testData.output = res;
                if(res.success){
                    var userSessionToken = res.userSession.token;
                    testData.input.sessionToken = userSessionToken;

                    //make a logout request
                    return request({
                        method: 'POST',
                        uri: `http://${serverConfigs.host}:${serverConfigs.port}${serverConfigs.paths.logout}`,
                        json: true,
                        headers: {Authorization : `Bearer ${testData.input.sessionToken}`}
                    })
                    .then((res) => {
                        testData.output = res;
                        if(res.success){
                            //make a current user request
                            return request({
                                method: 'GET',
                                uri: `http://${serverConfigs.host}:${serverConfigs.port}${serverConfigs.paths.currentUser}`,
                                json: true,
                                headers: {Authorization : `Bearer ${testData.input.sessionToken}`}
                            })
                            .then((res) => {
                                testData.output = res;
                                //operation must fail in order to test success
                                if(res.success){
                                    testData.result = 'FAILED';
                                }
                                else{
                                    testData.result = 'PASSED';
                                }
                                helper.PrintDetailedResult(testData);
                                return;
                            })
                        }
                        else{
                            testData.result = 'FAILED';
                            helper.PrintDetailedResult(testData);
                            return;
                        }
                    })
                }
                else{
                    testData.result = 'FAILED';
                }
                helper.PrintDetailedResult(testData);
                return;
            })
            .catch((err) => {
                testData.output = err;
                testData.result = 'FAILED';
                helper.PrintDetailedResult(testData);
                return;
            });
        },


        /*
        It accesses current user.
        it makes a current user request with an invalid user session token
        Test must fail
        */
        TestCurrentUserFailure2 : function(){

            var testData = {
                id: `#${++helper.testCounter}`,
                title: 'Testing Access Current User',
                context: context,
                description: 'Success test: with an invalid user session token',
                input:{
                    sessionToken : "invalidUserSessionToken"
                }
            };

            //accesses current user with invalid session token
            return request({
                method: 'GET',
                uri: `http://${serverConfigs.host}:${serverConfigs.port}${serverConfigs.paths.currentUser}`,
                json: true,
                headers : { Authorization : `Bearer ${testData.input.sessionToken}`}
            }).then((res) => {
                testData.output = res;
                if(res.success){
                    testData.result = 'FAILED';
                }
                else{
                    testData.result = 'PASSED';
                }
                helper.PrintDetailedResult(testData);
                return;
            })
            .catch((err) => {
                testData.output = err;
                testData.result = 'FAILED';
                helper.PrintDetailedResult(testData);
                return;
            });
        }
    }

}
