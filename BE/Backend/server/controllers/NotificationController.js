"use strict";
var joi = require('joi'),
Boom = require('boom'),
LogClient = require('../clients/log'),
BaseController = require('./BaseController.js'),
DatabaseService = require('../services/DatabaseService.js');

/**
* Notification controller, contains all functions to build the notification, this also extends BaseController
*/
class NotificationController extends BaseController {

    constructor() {
        super();
    }

    GetCollectionName() {
        return "notification";
    }
    /**
    * Returns the Notification items meeting the provided parameters. In case there are no search parameters, all notification items will be returned
    */
    Get() {
        return {
            method: 'GET',
            path: '/notification',
            config: {
                description: 'Get notification items',
                notes: 'Returns the notification items meeting the provided parameters. In case there are no search parameters, all notification items will be returned',
                tags: ['api'],
                pre: [{
                    method: BaseController.Authorize(['general', 'admin'])
                }],
                handler: (request, reply) => {
                    if(request.query.userId){
                        request.query.userId = DatabaseService.BuildObjectId(request.query.userId);
                    }
                    this.BaseGetHandler(this.GetCollectionName(), request, reply);
                },
                validate: {
                    query: {
                        id: joi.string().hex().optional().description("Filter notification items by id"),
                        subject: joi.string().optional().description("Filter notification items by subject"),
                        new: joi.boolean().optional().description("Filter notification items by new state"),
                        pinned: joi.boolean().optional().description("Filter notification items by pinned property"),
                        userId: joi.string().hex().optional().description("Filter notification items by user id"),

                    },
                    headers: joi.object({
                        'authorization': joi.string().required()
                    }).unknown()
                }
            }
        };
    }
    /**
    * Returns the notification item which matches the id received
    */
    GetItem() {
        return {
            method: 'GET',
            path: '/notification/{id}',
            config: {
                description: 'Get Notification Item',
                notes: 'Returns the Notification item which matches the id received',
                tags: ['api'],
                pre: [{
                    method: BaseController.Authorize(['general','admin'])
                }],
                handler: (request, reply) => {
                    this.BaseGetItemHandler(this.GetCollectionName(), request, reply);
                },
                validate: {
                    params: {
                        id: joi.string().hex().required().description("Filter notification item by id "),
                    },
                    headers: joi.object({
                        'authorization': joi.string().required()
                    }).unknown()
                }
            }
        };
    }

    /**
    * Create a new notification entity.
    */
    Post() {
        return {
            method: 'POST',
            path: '/notification',
            config: {
                description: 'Create notification item',
                notes: 'Create a new notification item and returns it.',
                tags: ['api'],
                pre: [{
                    method: BaseController.Authorize(['admin','general'])
                }],
                handler: (request, reply) => {
                    if(request.payload.userId){
                        request.payload.userId = DatabaseService.BuildObjectId(request.payload.userId);
                    }
                    request.payload.date = new Date();
                    request.payload.new = true;
                    request.payload.pinned = false;
                    this.BasePostHandler(this.GetCollectionName(), request, reply);
                },
                validate: {
                    payload: {
                        subject: joi.string().required().description("The subject of the notification item"),
                        text: joi.string().required().description("The text of the notification item"),
                        userId: joi.string().hex().required().description("The user id to which notification is related")
                    },
                    headers: joi.object({
                        'authorization': joi.string().required()
                    }).unknown()
                }
            }
        };
    }
    /**
    * Updates the notification item that has the id provided. If the update is sucessful then the notification otem data will be returned
    */
    Patch() {
        return {
            method: 'PATCH',
            path: '/notification',
            config: {
                description: 'Patch notification item',
                notes: 'Updates the notification item that has the id provided. If the update is sucessful then the notification item data will be returned',
                tags: ['api'],
                pre: [{
                    method: BaseController.Authorize(['admin','general'])
                }],
                handler: (request, reply) => {
                    if(request.payload.userId){
                        request.payload.userId = DatabaseService.BuildObjectId(request.payload.userId);
                    }
                    request.payload.date = new Date();
                    this.BasePatchHandler(this.GetCollectionName(), request, reply);
                },
                validate: {
                    payload: {
                        id: joi.string().hex().required().description("The notification id"),
                        subject: joi.string().optional().description("The subject of the notification item"),
                        text: joi.string().optional().description("The text of the notification item"),
                        new: joi.boolean().optional().description("The new state of the notification item"),
                        pinned: joi.boolean().optional().description("The pinned property of the notification item"),
                    },
                    headers: joi.object({
                        'authorization': joi.string().required()
                    }).unknown()
                }
            }
        };
    }
    /**
    * Deletes the notification item that has the id provided.
    */
    Delete() {
        return {
            method: 'DELETE',
            path: '/notification',
            config: {
                description: 'Deletes notification item',
                notes: 'Deletes the notification item that has the id provided',
                tags: ['api'],
                pre: [{
                    method: BaseController.Authorize(['admin','general'])
                }],
                handler: (request, reply) => {
                    this.BaseDeleteHandler(this.GetCollectionName(), request, reply);
                },
                validate: {
                    payload: {
                        id: joi.string().hex().required().description("The id of the notification item"),
                    },
                    headers: joi.object({
                        'authorization': joi.string().required()
                    }).unknown()
                }
            }
        };
    }
}
module.exports = new NotificationController();
