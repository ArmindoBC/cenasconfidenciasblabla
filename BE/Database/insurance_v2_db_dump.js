/**
 * Dump of the db
 */

 /*
 Uncomment the next DB call if you want to remove all collections every time the script runs
 */

 db.getCollectionNames().forEach(function(collection_name) {
 if (collection_name.indexOf("system.") == -1)
 db[collection_name].drop();
 else
 db.collection_name.remove({});
 });

/*
 * Product
 */
db.product.insert({
  "_id": ObjectId("000000000000000000000001"),
  "title": "Content"
})

db.product.insert({
  "_id": ObjectId("000000000000000000000002"),
  "title": "Motor"
})

db.product.insert({
  "_id": ObjectId("000000000000000000000003"),
  "title": "Workers Compensation"
})

/*
 * Coverage
 */

/*
* Content Coverages
*/
db.coverage.insert({
  "_id": ObjectId("000000000000000000000004"),
  "title": "Nature event",
  "type": "basic",
  "premium": 15.00,
  "product_id" : "000000000000000000000001"
})

db.coverage.insert({
  "_id": ObjectId("000000000000000000000005"),
  "title": "Theft",
  "type": "basic",
  "premium": 15.00,
  "product_id" : "000000000000000000000001"
})

db.coverage.insert({
  "_id": ObjectId("000000000000000000000006"),
  "title": "Other damage",
  "type": "basic",
  "premium": 15.00,
  "product_id" : "000000000000000000000001"
})

db.coverage.insert({
  "_id": ObjectId("000000000000000000000007"),
  "title": "Tools and locations",
  "type": "recommended",
  "premium": 15.00,
  "product_id" : "000000000000000000000001"
})

db.coverage.insert({
  "_id": ObjectId("000000000000000000000008"),
  "title": "Kitchen",
  "type": "recommended",
  "premium": 15.00,
  "product_id" : "000000000000000000000001"
})

db.coverage.insert({
  "_id": ObjectId("000000000000000000000009"),
  "title": "Unknown location",
  "type": "premium",
  "premium": 15.00,
  "product_id" : "000000000000000000000001"
})

db.coverage.insert({
  "_id": ObjectId("000000000000000000000010"),
  "title": "Glas an sanitation",
  "type": "premium",
  "premium": 15.00,
  "product_id" : "000000000000000000000001"
})

db.coverage.insert({
  "_id": ObjectId("000000000000000000000011"),
  "title": "Clinique",
  "type": "premium",
  "premium": 15.00,
  "product_id" : "000000000000000000000001"
})

/*
* Motor Coverages
*/

db.coverage.insert({
  "_id": ObjectId("000000000000000000000012"),
  "title": "Own damage",
  "type": "basic",
  "premium": 15.00,
  "product_id" : "000000000000000000000002"
})
db.coverage.insert({
  "_id": ObjectId("000000000000000000000013"),
  "title": "3rd party liability",
  "type": "basic",
  "premium": 15.00,
  "product_id" : "000000000000000000000002"
})
db.coverage.insert({
  "_id": ObjectId("000000000000000000000014"),
  "title": "Dealer/Workshop",
  "type": "recommended",
  "premium": 15.00,
  "product_id" : "000000000000000000000002"
})
db.coverage.insert({
  "_id": ObjectId("000000000000000000000015"),
  "title": "Medical/Legal assistance",
  "type": "recommended",
  "premium": 15.00,
  "product_id" : "000000000000000000000002"
})
db.coverage.insert({
  "_id": ObjectId("000000000000000000000016"),
  "title": "Environmental liability",
  "type": "recommended",
  "premium": 15.00,
  "product_id" : "000000000000000000000002"
})
db.coverage.insert({
  "_id": ObjectId("000000000000000000000017"),
  "title": "Other risks",
  "type": "recommended",
  "premium": 15.00,
  "product_id" : "000000000000000000000002"
})

/*
* Workers compensation Coverages
*/

db.coverage.insert({
  "_id": ObjectId("000000000000000000000018"),
  "title": "Employes",
  "type": "basic",
  "premium": 15.00,
  "product_id" : "000000000000000000000003"
})

db.coverage.insert({
  "_id": ObjectId("000000000000000000000019"),
  "title": "Part-time assistants",
  "type": "recommended",
  "premium": 15.00,
  "product_id" : "000000000000000000000003"
})

db.coverage.insert({
  "_id": ObjectId("000000000000000000000020"),
  "title": "Holder coverage",
  "type": "recommended",
  "premium": 15.00,
  "product_id" : "000000000000000000000003"
})
