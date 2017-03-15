"use strict";
var LogClient = require('../clients/log'),
joi = require('joi'),
BaseController = require('./BaseController.js'),
DatabaseService = require('../services/DatabaseService.js');


var policyStates = {
    quote: "quote",
    policy: "policy"
};

/**
* Policy controller, contains all functions to build the policy, this also extends BaseController
*/
class PolicyController extends BaseController {

    constructor() {
        super();
    }

    GetCollectionName() {
        return "policy";
    }
    /**
    * Creates a new policy and returns a associated ID
    */
    Create() {
        return {
            method: 'POST',
            path: '/policy',
            config: {
                description: 'Create Policy',
                notes: 'Creates a new Policy and returns the new associated Id',
                tags: ['api'],
                handler: (request, reply) => {
                    var policyData = request.payload;

                    //convert userId string into an ObjectId
                    if(policyData.userId){
                        policyData.userId = DatabaseService.BuildObjectId(policyData.userId);
                    }

                    //assign the date in which the policy/quote was created
                    policyData.creationDate = new Date();

                    //assign a state to the policy
                    //if it is not a final policy it will be saved as a quote
                    if(policyData.state != policyStates.policy){
                        policyData.state = policyStates.quote;
                    } else{
                        policyData.activationDate = new Date();
                        policyData.policyNumber = Math.floor((Math.random() * 10000000000) + 1);
                    }
                    request.server.inject({
                        method: "GET",
                        url : "/product"
                    }, (productsList) => {

                        this.CalculatePolicyPrice(policyData, productsList);
                        this.BasePostHandler(this.GetCollectionName(), request, reply);
                    })

                },
                validate: {
                    payload: {
                        userId : joi.string().hex().required().description("The id of the user"),
                        businessName: joi.string().required().description("The business name for which the policy has been buyed"),
                        userName: joi.string().required().description("The user name for which the policy has been buyed"),
                        businessType: {
                            value: joi.number().integer().required().description("The bussiness type value for which the policy has been buyed"),
                            text: joi.string().required().description("The bussiness type text for which the policy has been buyed")
                        },
                        zipCode1: joi.string().required().description("The business zipCode1 for which the policy has been buyed"),
                        zipCode2: joi.string().required().description("The business zipCode2 for which the policy has been buyed"),
                        income: joi.string().required().description("The business income for which the policy has been buyed"),
                        numberEmployees: {
                            value: joi.number().integer().required().description("The number of employees (value) of the bussiness for which the policy has been buyed"),
                            text: joi.string().required().description("The number of employees (text) of the bussiness for which the policy has been buyed")
                        },
                        packageSelected: joi.string().required().description("The package selected for the policy (basic, recommended, premium and personalized)"),
                        selectedCoverages: joi.array().required().description("The coverages selected for the policy"),
                        price : joi.object().optional().description("The price of the policy"),
                        paymentProperties : joi.object().required().description("The payment properties for the policy"),
                        receiveMethods : joi.object().required().description("The receive methods for the policy"),
                        insured : joi.object().required().description("The entities insured by the policy"),
                        state: joi.string().optional().description("The state of the policy. Must be 'quote' or 'policy' regarding being a final policy or a quote"),
                    }
                }
            }
        };
    }
    /**
    * Updates the Policy that has the id provided. If the update is sucessful then the id of the Policy will be returned
    */
    Update() {
        return {
            method: 'PATCH',
            path: '/policy',
            config: {
                description: 'Update Policy',
                notes: 'Updates the Policy that has the id provided. If the update is sucessful then the id of the Policy will be returned',
                tags: ['api'],
                handler: (request, reply) => {
                    var policyData = request.payload;

                    //convert userId string into an ObjectId
                    if(policyData.userId){
                        policyData.userId = DatabaseService.BuildObjectId(policyData.userId);
                    }

                    //assign a state to the policy
                    //if it is not a final policy it will be saved as a quote
                    if(policyData.state != policyStates.policy){
                        policyData.state = policyStates.quote;
                    } else{
                        policyData.activationDate = new Date();
                        policyData.policyNumber = Math.floor((Math.random() * 10000000000) + 1);
                    }
                    request.server.inject({
                        method: "GET",
                        url : "/product"
                    }, (productsList) => {
                        console.log(policyData)
                        if(policyData.selectedCoverages){
                            this.CalculatePolicyPrice(policyData, productsList);
                        }
                        this.BasePatchHandler(this.GetCollectionName(), request, reply);
                    })
                },
                validate: {
                    payload: {
                        id: joi.string().hex().required().description("The id of the policy"),
                        userId : joi.string().hex().optional().description("The id of the user"),
                        businessName: joi.string().optional().description("The business name for which the policy has been buyed"),
                        userName: joi.string().optional().description("The user name for which the policy has been buyed"),
                        businessType: {
                            value: joi.number().integer().optional().description("The bussiness type value for which the policy has been buyed"),
                            text: joi.string().optional().description("The bussiness type text for which the policy has been buyed")
                        },
                        zipCode1: joi.string().optional().description("The business zipCode1 for which the policy has been buyed"),
                        zipCode2: joi.string().optional().description("The business zipCode2 for which the policy has been buyed"),
                        income: joi.string().optional().description("The business income for which the policy has been buyed"),
                        numberEmployees: {
                            value: joi.number().integer().optional().description("The number of employees (value) of the bussiness for which the policy has been buyed"),
                            text: joi.string().optional().description("The number of employees (text) of the bussiness for which the policy has been buyed")
                        },
                        packageSelected: joi.string().optional().description("The package selected for the policy (basic, recommended, premium and personalized)"),
                        selectedCoverages: joi.array().optional().description("The coverages selected for the policy"),
                        price : joi.object().optional().description("The price of the policy"),
                        paymentProperties : joi.object().optional().description("The payment properties for the policy"),
                        receiveMethods : joi.object().optional().description("The receive methods for the policy"),
                        insured : joi.object().optional().description("The entities insured by the policy"),
                        state: joi.string().optional().description("The state of the policy. Must be 'quote' or 'policy' regarding being a final policy or a quote"),
                    },
                }
            }
        };
    }
    CalculatePolicyPrice(policyData, productsList){
        var productPrices = {
            Motor: 0,
            Content : 0,
            WorkersCompensation: 0
        },
        totalMonth = 0;

        productsList.result.forEach((product)=>{

            policyData.selectedCoverages.forEach( (coverage) => {
                if(product.id.toString() === coverage.productid){
                    if(product.title === "Motor"){
                        productPrices["Motor"] += coverage.premium;
                    }
                    else if(product.title === "Content"){
                        productPrices["Content"] += coverage.premium;
                    }
                    else if(product.title === "Workers Compensation"){
                        productPrices["WorkersCompensation"] += coverage.premium;
                    }
                }
            });

            if(product.title === "Motor"){
                productPrices["Motor"] *= policyData.insured.vehicles.length ;
                totalMonth += productPrices["Motor"] ;
            }
            else if(product.title === "Content"){
                productPrices["Content"] *= policyData.insured.properties.length ;
                totalMonth += productPrices["Content"] ;
            }
            else if(product.title === "Workers Compensation"){
                productPrices["WorkersCompensation"] *= policyData.insured.persons.length ;
                totalMonth += productPrices["WorkersCompensation"] ;
            }
        });
        policyData.price = {};
        policyData.price.month = {};
        policyData.price.annual = {};


        for(var key in productPrices) {
            policyData.price.month[key] = productPrices[key];
            policyData.price.annual[key] = productPrices[key]*12;
        }
        policyData.price.month.total = totalMonth;
        policyData.price.annual.total = totalMonth * 12;
    }
    /**
    * Returns the policy items meeting the provided parameters. In case there are no search parameters, all notification items will be returned
    */
    Get() {
        return {
            method: 'GET',
            path: '/policy',
            config: {
                description: 'Get Policy items',
                notes: 'Returns the policy items meeting the provided parameters. In case there are no search parameters, all notification items will be returned',
                tags: ['api'],
                pre: [{
                    method: BaseController.Authorize(['general', 'admin'])
                }],
                handler: (request, reply) => {
                    //convert userId string into an ObjectId
                    if(request.query.userId){
                        request.query.userId = DatabaseService.BuildObjectId(request.query.userId);
                    }
                    this.BaseGetHandler(this.GetCollectionName(), request, reply);
                },
                validate: {
                    query: {
                        id: joi.string().hex().optional().description("Filter policy items by id"),
                        userId: joi.string().hex().optional().description("Filter policy items by user id"),
                        businessType: joi.string().optional().description("The bussiness type for which the policy has been buyed"),
                        numberEmployees: joi.number().integer().optional().description("The number of employees of the bussiness for which the policy has been buyed"),
                        packageSelected: joi.string().optional().description("The package selected for the policy (basic, recommended, premium and personalized)"),
                        state: joi.string().optional().description("The state of the policy. Must be 'quote' or 'policy' regarding being a final policy or a quote"),
                    },
                    headers: joi.object({
                        'authorization': joi.string().required()
                    }).unknown()
                }
            }
        };
    }

}

module.exports = new PolicyController();
