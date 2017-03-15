"use strict";
var ServerService = require('./ServerService.js');

/**
 * Unit of Work Service: Responsible for MongoDB connection
 */

class DatabaseService {

  constructor() {}

  GetDatabaseAccess() {
    return ServerService.GetDatabaseConnection().db;
  }

  BuildObjectId(id) {
    return new(ServerService.GetDatabaseConnection()).ObjectID(id);
  }

  GetCollection(collectionName) {
    return this.GetDatabaseAccess().collection(collectionName);
  }

}
module.exports = new DatabaseService();
