"use strict";
app.controller('InsuranceChoiceController', ["$scope", "$filter", "$location", "QuoteInfoRepository", function($scope, $filter, $location, QuoteInfoRepository) {
  var logClient = new LogClient(); //jshint ignore:line
  logClient.SendLog({
    level: 'TRACE',
    category: "information",
    message: "InsuranceChoiceController started"
  });

  /*
    Stores errors for each one of the new items in vehicles, persons or properties sections
  */
  $scope.errors = {
    vehicles: {},
    persons: {},
    properties: {}
  };

  $scope.QuoteInfoRepository = QuoteInfoRepository;

  /*
    Stores info about the items that are being added to the insured parts
  */
  $scope.newItem = {
      vehicles : undefined,
      properties: undefined,
      persons : undefined
  }

  /*
    Receives an insuranceChoiceType and adds a new line on the proper section
    It introduces a new item on newItem object and adds default data on it
  */
  $scope.AddInsuranceLine = function(insuranceChoiceType) {
    //Create new item
    var newItem = {};
    var forName = "";

    //adds default data to the new item object regarding to its type
    if (insuranceChoiceType == "vehicles") {
      newItem.brandModel = "";
      newItem.registration = "";
      newItem.value = "";
      newItem.year = "";
      forName = "editItemForm";
    }
    else if (insuranceChoiceType == "persons") {
      newItem.name = "";
      newItem.role = "";
      newItem.age = "";
      newItem.salary = "";
      forName = "editPersonForm";
    }
    else if (insuranceChoiceType == "properties") {
      newItem.name = "";
      newItem.address = "";
      forName = "editPropertieForm";
    }

    //stores new item on newItem scope object
    $scope.newItem[insuranceChoiceType] = newItem;

    //update Board height
    $scope.ToogleAddButton(insuranceChoiceType);
    //open form
    setTimeout(function() {
      $scope.EditItem(insuranceChoiceType, "newItem", forName);
    }, 250);
  };

  /*
    it receives an insurance choice type and a boolean refering if form is open or not.
    It adds or removes add button if new item form is or isn't open
  */
  $scope.ToogleAddButton = function(insuranceChoiceType, formOpen) {
    //get board element
    var Element = $("#InsuranceChoicePackage_" + insuranceChoiceType);

    //Show button after the animation gets completed
    if(formOpen){
        Element.find(".addButton").hide();
    }
    else{
        Element.find(".addButton").show();
    }
  };

  /*
    Method used to close of open edit item on each one of the insurance choice types
  */
  $scope.ToogleEditItem = function(insuranceChoiceType, itemIndex, formName){
      var form = $("#"+formName + itemIndex);
      if(form.is(":visible")){
          $scope.CloseEditItem(insuranceChoiceType, itemIndex, formName)
      }
      else{
          $scope.EditItem(insuranceChoiceType, itemIndex, formName);
      }
  }

  /*
    It hides add button and shows form to edit the item choosed
  */
  $scope.EditItem = function(insuranceChoiceType, itemIndex, formName) {
    //Open form
    $scope.ToogleAddButton(insuranceChoiceType, true);
    $("#"+formName + itemIndex).show();

    //change arrow direction
    var editButtonElem = $("#"+formName + itemIndex).parent().find(".icon-quote-1");
    editButtonElem.addClass("icon-up");
    editButtonElem.removeClass("icon-down");
  }

  /*
    It shows add button and hides form of the item choosed
  */
  $scope.CloseEditItem = function(insuranceChoiceType, itemIndex, formName) {
    //Open form
    $("#" + formName + itemIndex).hide();
    $scope.ToogleAddButton(insuranceChoiceType);
    //change arrow direction
    var editButtonElem = $("#"+formName + itemIndex).parent().find(".icon-quote-1");

    editButtonElem.removeClass("icon-up");
    editButtonElem.addClass("icon-down");
  }

  /*
    Handles delete button
    It removes an item and close its form
  */
  $scope.RemoveItem = function(insuranceChoiceType, itemIndex, formName) {
    $scope.CloseEditItem(insuranceChoiceType, itemIndex, formName)
    QuoteInfoRepository.bundle.insured[insuranceChoiceType].splice(itemIndex, 1);
    setTimeout(function() {
      $scope.ToogleAddButton(insuranceChoiceType);
    }, 250);
  }
  /*
    Handles cancel button
    It hides the form for the new item introduction and discards its content
  */
  $scope.CancelNewItem = function(insuranceChoiceType, formName){
      $scope.newItem[insuranceChoiceType] = undefined;
      $scope.CloseEditItem(insuranceChoiceType, 'newItem', formName)
  }
  /*
    It validates the new items form.
    It it used to validate new vehicles, persons and properties
  */
  $scope.ValidateChoiceForm = function(item, field, column){
      if (column === 'vehicles'){
          //brand model is required
          if(field === 'brandModel' || !field){
              if(!item.brandModel || item.brandModel === ''){
                  $scope.errors.vehicles.brandModel = "The brand & model is mandatory.";
              }
              else {
                  $scope.errors.vehicles.brandModel = undefined;
              }
          }
          //value is required and must only contain digits
          if(field === 'value' || !field){
              if(!item.value || !item.value.match(/^\d+$/)){
                  $scope.errors.vehicles.value = "The value of your car must only contain digits.";
              }
              else {
                  $scope.errors.vehicles.value = undefined;
              }
          }
          //registration is required and must follow AA-00-00, 00-AA-00 or 00-00-AA pattern
          if(field === 'registration' || !field){
              if(!item.registration || item.registration === '' || !item.registration.match(/([A-Za-z]{2}-\d{2}-\d{2})|(\d{2}-[A-Za-z]{2}-\d{2})|(\d{2}-\d{2}-[A-Za-z]{2})$/) ){
                  $scope.errors.vehicles.registration = "Your registration must follow the 00-AA-00, AA-00-00 or 00-00-AA pattern";
              }
              else {
                  $scope.errors.vehicles.registration = undefined;
              }
          }
          //year is required and must only contain 4 digits
          if(field === 'year' || !field){
              if(!item.year || item.year === '' || !item.year.match(/^\d{4}$/) ){
                  $scope.errors.vehicles.year = "The year of your car must only contain digits.";
              }
              else if(item.year < 1900 || item.year > new Date().getFullYear()){
                  $scope.errors.vehicles.year = "The year of your car must be greater than 1900 and lower than current year";
              }
              else {
                  $scope.errors.vehicles.year = undefined;
              }
          }
      }
    else if(column === 'persons'){
      //name is required and must only contain letters, spaces and accent characters
      if (field === 'name' || !field){
        if(!item.name || item.name === '' || !item.name.match(/^[A-Za-z_  \u00C0-\u017F\u00AA\u00BA]+$/) ){
          $scope.errors.persons.name = "Your name must only contain letters (a-z,A-Z) and spaces.";
        }
        else{
          $scope.errors.persons.name = undefined;
        }
      }
      //role is required and must only contain letters, spaces and accent characters
      if (field === 'role' || !field){
        if(!item.role || item.role === '' || !item.role.match(/^[A-Za-z0-9_  \u00C0-\u017F\u00AA\u00BA\u002E]+$/) ){
          $scope.errors.persons.role = "Your role must only contain letters (a-z,A-Z) and spaces.";
        }
        else{
          $scope.errors.persons.role = undefined;
        }
      }
      //age is required and must only digits
      if (field === 'age' || !field){
        if(!item.age || item.age === '' || !item.age.match(/^\d+$/) ){
          $scope.errors.persons.age = "Your age must only contain digits.";
        }
        else if(item.age < 18 || item.age > 100){
            $scope.errors.persons.age = "The person age must be between 18 and 100 years old.";
        }
        else{
          $scope.errors.persons.age = undefined;
        }
      }
      //salary is required and must only digits
      if (field === 'salary' || !field){
        if(!item.salary || item.salary === '' || !item.salary.match(/^\d+$/)){
          $scope.errors.persons.salary = "Your salary must only contain digits.";
        }
        else{
          $scope.errors.persons.salary = undefined;
        }
      }
    }
    else if(column === 'properties'){
      //name is required and must only contain letters, spaces, accent characters, numbers, commas and full stops
      if (field === 'name' || !field){
        if(!item.name || item.name === '' || !item.name.match(/^[A-Za-z_  \u00C0-\u017F\u002d\u00AA\u00BA\u002C\u0030-\u0039\u002E]+$/)){
          $scope.errors.properties.name = "Your property name must only contain letters (a-z,A-Z), spaces, numbers, commas and full stops.";
        }
        else{
          $scope.errors.properties.name = undefined;
        }
      }
      //name is required and must only contain letters, spaces, accent characters, numbers, commas and full stops
      if (field === 'address' || !field){
        if(!item.address || item.address === '' || !item.address.match(/^[A-Za-z_  \u00C0-\u017F\u00AA\u00BA\u002C\u0030-\u0039\u002E]+$/)){
          $scope.errors.properties.address = "Your address must only contain letters (a-z,A-Z), spaces, numbers, commas and full stops.";
        }
        else{
          $scope.errors.properties.address = undefined;
        }
      }
    }
  }

  /*
    Add new item to the insured parts
    Before add it, it validates the data
  */
  $scope.addChoice = function(item,column,index,formName){
    $scope.ValidateChoiceForm(item,undefined,column);
    if(JSON.stringify($scope.errors[column]) === '{}'){
        $scope.CloseEditItem(column,index,formName);

        if(index === 'newItem'){
            QuoteInfoRepository.bundle.insured[column].push(item);
            $scope.newItem[column] = undefined;
        }


    }
  }

  /*
    Returns the number of insured parts added
  */
  $scope.InsuredNumber = function(){
      var number = 0;
      number += QuoteInfoRepository.bundle.insured.vehicles.length;
      number += QuoteInfoRepository.bundle.insured.persons.length;
      number += QuoteInfoRepository.bundle.insured.properties.length;

      return number;
  }

  /*
    Initialize controller
  */
  $scope.Init = function() {
    $("body").scrollTop(0);

    //Fix boards
    $scope.ToogleAddButton("vehicles", false);
    $scope.ToogleAddButton("persons", false);
    $scope.ToogleAddButton("properties", false);
  };
  $scope.Init();
}]);
