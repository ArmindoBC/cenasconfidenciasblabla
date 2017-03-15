"use strict";
var BaseController = require('./BaseController.js'),
ConfigurationService = require('../services/ConfigurationService'),
authClient = require('../clients/auth'),
LogClient = require('../clients/log'),
Boom = require('boom'),
joi = require('joi');

/**
* UMS authorization controller
*/

class AuthController extends BaseController {
    /**
    * Main constructor for the UMS system
    */
    constructor() {
        super();
    }
    /**
    * Social Login, provides google, facebook and linedin login
    */
    SocialLogin() {
        return {
            method: 'POST',
            path: '/auth/social-login/{provider}/',
            config: {
                description: 'Social login',
                notes: 'It receives social data from providers like Google, Facebook or LinkedIn and proceeds with an user registration.',
                tags: ['api'],
                handler: (request, reply) => {
                    request.payload.groups = ConfigurationService.GetDefaultUserGroups();
                    return authClient.SocialLogin(request.params.provider, request.payload)
                    .then((res) => {
                        if (res.success) {
                            request.server.inject({
                                method: "POST",
                                url : "/user",
                                payload: {
                                    id: res.user.id,
                                    email: res.user.email,
                                    username : res.user.username
                                }
                            }, (userPostRes) => {
                                if(userPostRes.statusCode === 200){
                                    reply(res);
                                }
                                else{
                                    reply(userPostRes);
                                }
                            })
                        } else {
                            LogClient.Log({
                                level: 'WARN',
                                category: "auth controller",
                                message: "Error in social login " + res.errors.join(',')
                            });
                            reply(res);
                        }

                    })
                    .catch((err) => {
                        LogClient.Log({
                            level: 'ERROR',
                            category: "auth controller",
                            message: "Error while social login. Error: " + err.message
                        });
                        reply(Boom.badRequest(err.message));
                    });
                },
                validate: {
                    params: {
                        provider: joi.string().description("The identifier of the social provider."),
                    },
                    payload: joi.object()
                }
            }
        };
    }
    /**
    * Register, is provided data in order to signup a user to the authentication.
    */
    Signup() {
        return {
            method: 'POST',
            path: '/auth/signup/',
            config: {
                description: 'Local user registration',
                notes: 'It receives user data and send them to UMS in order to register and authenticate them. If signup and authentication succeeds a session token is retrieved.',
                tags: ['api'],
                handler: (request, reply) => {
                    request.payload.groups = ConfigurationService.GetDefaultUserGroups();

                    return authClient.Signup(request.payload)
                    .then((res) => {
                        if (res.success) {
                            request.server.inject({
                                method: "POST",
                                url : "/user",
                                payload: {
                                    id: res.userSession.user.id,
                                    email: request.payload.email,
                                    username : request.payload.username
                                }
                            }, (userPostRes) => {

                                if(userPostRes.statusCode === 200){
                                    reply(res);
                                }
                                else{
                                    reply(userPostRes);
                                }
                            })
                        } else {
                            LogClient.Log({
                                level: 'WARN',
                                category: "auth controller",
                                message: "Error in signup " + res.errors.join(',')
                            });
                            reply(res);
                        }

                    })
                    .catch((err) => {
                        LogClient.Log({
                            level: 'ERROR',
                            category: "auth controller",
                            message: "Error while user registration. Error: " + err.message
                        });
                        reply(Boom.badRequest(err.message));
                    });
                },
                validate: {
                    payload: {
                        username: joi.string().description("The username of the user who wants to signup."),
                        email: joi.string().email().description("The email of the user who wants to signup."),
                        password: joi.string().description("The password of the user who wants to signup."),
                    },
                }
            }
        };
    }
    /**
    * Receives user credentials and send them to UMS in order to authenticate them.
    */
    Login() {
        return {
            method: 'POST',
            path: '/auth/login/',
            config: {
                description: 'Local user login',
                notes: 'It receives user credentials and send them to UMS in order to authenticate them. If authentication succeeds a session token is retrieved.',
                tags: ['api'],
                handler: (request, reply) => {

                    return authClient.Login(request.payload)
                    .then((res) => {
                        if (res.success) {
                            return reply(res);
                        } else {
                            LogClient.Log({
                                level: 'WARN',
                                category: "auth controller",
                                message: "Error in login " + res.errors.join(',')
                            });
                            reply(res);
                        }

                    })
                    .catch((err) => {
                        LogClient.Log({
                            level: 'ERROR',
                            category: "auth controller",
                            message: "Error while user authentication. Error: " + err.message
                        });
                        reply(Boom.badRequest(err.message));
                    });
                },
                validate: {
                    payload: {
                        username: joi.string().description("The username of the user who wants to login."),
                        password: joi.string().description("The password of the user who wants to login."),
                    },
                }
            }
        };
    }
    LoginAD() {
        return {
            method: 'POST',
            path: '/auth/login-ad/',
            config: {
                description: 'Active Directory user login',
                notes: 'It receives user credentials and send them to UMS in order to authenticate them with a Active Directory service. If authentication succeeds a session token is retrieved.',
                tags: ['api'],
                handler: (request, reply) => {

                    return authClient.LoginAD(request.payload)
                    .then((res) => {
                        if(res.success){
                            return reply(res);
                        }
                        else{
                            LogClient.Log({
                                level:'WARN',
                                category : "auth controller",
                                message : "Error in AD login " + res.errors.join(',')
                            });
                            reply(res);
                        }

                    })
                    .catch( (err) => {
                        LogClient.Log({
                            level:'ERROR',
                            category : "auth controller",
                            message : "Error while user authentication. Error: " +err.message
                        });
                        reply(Boom.badRequest(err.message));
                    })
                },
                validate: {
                    payload: {
                        username: joi.string().description("The username of the user who wants to login."),
                        password: joi.string().description("The password of the user who wants to login."),
                    },
                }
            }
        };
    }
    /**
    * Receives a session token by Authorization header checks if it is valid and if its user owner belongs to any group received
    */
    Authorize() {
        return {
            method: 'POST',
            path: '/auth/authorize/',
            config: {
                description: 'Authorize user by its session token and a set of allowed groups',
                notes: 'Receives a session token by Authorization header checks if it is valid and if its user owner belongs to any group received',
                tags: ['api'],
                handler: (request, reply) => {
                    if (!request.headers.authorization) {
                        return reply(Boom.unauthorized("You don't have permission. Authorization token required"));
                    }
                    var credentials = request.headers.authorization.split(' ');

                    if (credentials[0] !== 'Bearer') {
                        LogClient.Log({
                            level: "ERROR",
                            category: `auth controller`,
                            message: `Error: authorization scheme must follow Bearer strategy.`
                        });
                        reply(Boom.badRequest());
                    } else {
                        var groups = request.payload ? request.payload.groups : [];
                        return authClient.Authorize({
                            token: credentials[1],
                            groups: groups
                        })
                        .then((res) => {
                            if (res.success) {
                                return reply(res);
                            } else {
                                LogClient.Log({
                                    level: 'WARN',
                                    category: "auth controller",
                                    message: "User not authorized " + res.errors.join(',')
                                });
                                reply(Boom.unauthorized("User not authorized " + res.errors.join(',')));
                            }

                        })
                        .catch((err) => {
                            LogClient.Log({
                                level: 'ERROR',
                                category: "auth controller",
                                message: "Error while user authorization. Error: " + err.message
                            });
                            reply(Boom.badRequest(err.message));
                        });
                    }
                },
                validate: {
                    payload: {
                        groups: joi.array().description("The identifiers of the groups to check if user is authorized."),
                    },
                    headers: joi.object({
                        'authorization': joi.string().required()
                    }).unknown()
                }
            }
        };
    }
    /**
    * Receives a session token by Authorization header and it invalidates it in user management system
    */
    Logout() {
        return {
            method: 'POST',
            path: '/auth/logout/',
            config: {
                description: 'Invalidate user session',
                notes: 'Receives a session token by Authorization header and it invalidates it in user management system',
                tags: ['api'],
                handler: (request, reply) => {
                    if (!request.headers.authorization) {
                        return reply(Boom.unauthorized("You don't have permission. Authorization token required"));
                    }
                    var credentials = request.headers.authorization.split(' ');

                    if (credentials[0] !== 'Bearer') {
                        LogClient.Log({
                            level: "ERROR",
                            category: `auth controller`,
                            message: `Error: authorization scheme must follow Bearer strategy.`
                        });
                        reply(Boom.badRequest());
                    } else {
                        return authClient.Logout(credentials[1])
                        .then((res) => {
                            if (res.success) {
                                return reply(res);
                            } else {
                                LogClient.Log({
                                    level: 'WARN',
                                    category: "auth controller",
                                    message: "Invalid request. Error in logout"
                                });
                                reply(res);
                            }

                        })
                        .catch((err) => {
                            LogClient.Log({
                                level: 'ERROR',
                                category: "auth controller",
                                message: "Error while user logout. Error: " + err.message
                            });
                            if(err.response.statusCode === 401){
                                reply(Boom.unauthorized(err.message));
                            }
                            else{
                                reply(Boom.badRequest(err.message));
                            }
                        });
                    }
                },
                validate: {
                    headers: joi.object({
                        'authorization': joi.string().required()
                    }).unknown()
                }
            }
        };
    }
    /**
    * Receives a session token by Authorization header and retrieves user that owns the session token
    */
    CurrentUser() {
        return {
            method: 'GET',
            path: '/auth/current-user/',
            config: {
                description: 'Retrieves current user information',
                notes: 'Receives a session token by Authorization header and retrieves user that owns the session token',
                tags: ['api'],
                handler: (request, reply) => {
                    if (!request.headers.authorization) {
                        return reply(Boom.unauthorized("You don't have permission. Authorization token required"));
                    }
                    var credentials = request.headers.authorization.split(' ');

                    if (credentials[0] !== 'Bearer') {
                        LogClient.Log({
                            level: "ERROR",
                            category: `auth controller`,
                            message: `Error: authorization scheme must follow Bearer strategy.`
                        });
                        reply(Boom.badRequest());
                    } else {
                        return authClient.CurrentUser(credentials[1])
                        .then((res) => {
                            if (res.success) {
                                return reply(res);
                            } else {
                                LogClient.Log({
                                    level: 'WARN',
                                    category: "auth controller",
                                    message: "Invalid request. Error requesting current user. " + res.errors.join(',')
                                });
                                reply(res);
                            }

                        })
                        .catch((err) => {
                            LogClient.Log({
                                level: 'ERROR',
                                category: "auth controller",
                                message: "Error while retrieving current user. Error: " + err.message
                            });
                            reply(Boom.badRequest(err.message));
                        });
                    }
                },
                validate: {
                    headers: joi.object({
                        'authorization': joi.string().required()
                    }).unknown()
                }
            }
        };
    }
}

module.exports = new AuthController();
