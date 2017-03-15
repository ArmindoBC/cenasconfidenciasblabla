"use strict";
var joi = require('joi'),
Boom = require('boom'),
BaseController = require('./BaseController.js'),
DatabaseService = require('../services/DatabaseService.js');

/**
* User controller, contains all functions to build the user, this also extends BaseController
*/
class UserController extends BaseController {

    constructor() {
        super();
    }

    GetCollectionName() {
        return "user";
    }

    /**
    * Returns the User which matches the id received
    */
    GetItem() {
        return {
            method: 'GET',
            path: '/user/{id}',
            config: {
                description: 'Get User',
                notes: 'Returns the User which matches the id received',
                tags: ['api'],
                pre: [{
                    method: BaseController.Authorize(['general','admin'])
                }],
                handler: (request, reply) => {
                    this.BaseGetItemHandler(this.GetCollectionName(), request, reply);
                },
                validate: {
                    params: {
                        id: joi.string().hex().required().description("Filter user by id "),
                    },
                    headers: joi.object({
                        'authorization': joi.string().required()
                    }).unknown()
                }
            }
        };
    }
    /**
    * Returns the Users meeting the provided parameters. In case there are no search parameters, all Users will be returned
    */
    Get() {
        return {
            method: 'GET',
            path: '/user',
            config: {
                description: 'Get Users',
                notes: 'Returns the Users meeting the provided parameters. In case there are no search parameters, all Users will be returned',
                tags: ['api'],
                pre: [{
                    method: BaseController.Authorize(['admin'])
                }],
                handler: (request, reply) => {
                    this.BaseGetHandler(this.GetCollectionName(), request, reply);
                },
                validate: {
                    query: {
                        id: joi.string().hex().optional().description("Filter user by id (same as use path/{id})"),
                        email: joi.string().optional().description("Filter user by email")
                    },
                    headers: joi.object({
                        'authorization': joi.string().required()
                    }).unknown()
                }
            }
        };
    }

    /**
    * Create a new user entity.
    */
    Post() {
        return {
            method: 'POST',
            path: '/user',
            config: {
                description: 'Create User',
                notes: 'Create a new user and returns it.',
                tags: ['api'],
                handler: (request, reply) => {
                    var collection = DatabaseService.GetCollection(this.GetCollectionName());
                    var parsedData = this.ParseQueryByDatabaseDictionary(request.payload);
                    var id = parsedData._id;
                    delete parsedData._id;

                    collection.findAndModify(
                        {
                            _id : id
                        },//query properties,
                        {},
                        {
                            $set: parsedData //update properties
                        },
                        {
                            new: true,
                            upsert: true // insert the document if it does not exist
                        }
                        , (err, doc)=>{
                            if(err){
                                reply(Boom.wrap(err, 400));
                            }
                            else{
                                reply(this.BuildGetItemMessage(err, doc.value));
                            }
                        })

                },
                validate: {
                    payload: {
                        id: joi.string().hex().required().description("The id of the user created by the user management system"),
                        email: joi.string().allow('').required().description("The user's email"),
                        username: joi.string().required().description("The username"),
                    }
                }
            }
        };
    }
    /**
    * Updates the user item that has the id provided. If the update is sucessful then the notification item data will be returned
    */
    Patch() {
        return {
            method: 'PATCH',
            path: '/user',
            config: {
                description: 'Patch user item',
                notes: 'Updates the user item that has the id provided. If the update is sucessful then the user item data will be returned',
                tags: ['api'],
                pre: [{
                    method: BaseController.Authorize(['admin','general'])
                }],
                handler: (request, reply) => {
                    this.BasePatchHandler(this.GetCollectionName(), request, reply);
                },
                validate: {
                    payload: {
                        id: joi.string().hex().required().description("The id of the user created by the user management system"),
                        email: joi.string().optional().description("The user's email"),
                        username: joi.string().optional().description("The username"),
                        fullName: joi.string().optional().description("The user's fullname"),
                        address: joi.string().allow('').optional().description("The user's address"),
                        birthDate: joi.string().optional().description("The user's birth date"),
                        phone: joi.string().allow('').optional().description("The user's phone"),
                        nif: joi.string().allow('').optional().description("The user's nif"),
                    },
                    headers: joi.object({
                        'authorization': joi.string().required()
                    }).unknown()
                }
            }
        };
    }

}
module.exports = new UserController();
