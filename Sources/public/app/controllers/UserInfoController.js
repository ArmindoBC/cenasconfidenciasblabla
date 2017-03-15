"use strict";
app.controller('UserInfoController', ["$scope","$filter","$location","QuoteInfoRepository", "Configs", function($scope, $filter,$location, QuoteInfoRepository, Configs) {

  var logClient = new LogClient(); //jshint ignore:line
  logClient.SendLog({
    level: 'TRACE',
    category: "information",
    message: "UserInfoController started"
  });

  $scope.configs = Configs;
  $scope.UserInputData = QuoteInfoRepository.bundle.userInfoData;

  /*
    Default data for user info form
    It stores data for business types and number of employees select boxes
  */
  $scope.UserFormData = {
      businessTypes: QuoteInfoRepository.businessTypes,
      numberEmployees :  QuoteInfoRepository.numberEmployees,
      errors: {}

  };
  /*
    It allows to resize select boxes in order to it fits selected option content
    By default, select box always has de width of the largest option.
    This methods allows to resize it to the selected content
  */
  $.fn.resizeselect = function() {
      return this.each(function() {

        $(this).change(function(){
          var $this = $(this);
          //it appends the option content to the text, catch it width, remove it and resize
          // create test element
          var text = $this.find("option:selected").text();
          var $test = $("<span>").html(text);
          // add to body, get width, and get out
          $test.prependTo($this.parent())
          var width = $test.width();
          $test.remove();
          // set select width
          $this.width(width + 10);

          // run on start
        }).change();

      });
    };

    /*
        It handles the get a quote button click
        Before redirect to the next page, it validates the form and only if no errors are found
        the user is redirected to next step
    */
    $scope.GetQuote = function(){
        $scope.ValidateQuoteForm();

        if(JSON.stringify($scope.UserFormData.errors) === '{}'){
            $location.url('/quote/1');
        }
    }

    /*
        Set focus to zipCode2 input when zip code 1 unput has 4 digits
    */
    $scope.SetFocus = function(){
        if($scope.UserInputData.zipCode1.match(/(^\d{4}$)/)){
            setTimeout(function(){
                $(".editable2").focus();
            },0)
        }
    }

    /*
        Validates quote form
    */
    $scope.ValidateQuoteForm = function(field){
        //validates name, it is required and it only allows letters, spaces and accent characters
        if(field === "name" || !field){
            if(!$scope.UserInputData.name || $scope.UserInputData.name.length === 0 ){
                $scope.UserFormData.errors.name = "Your name is required to get a quote."
            }
            else if(!$scope.UserInputData.name.match(/^[A-Za-z_  \u00C0-\u017F\u00AA\u00BA]+$/)) {
                $scope.UserFormData.errors.name = "Your name must only contain letters (a-z,A-Z), spaces and accent characters."
            }
            else{
                $scope.UserFormData.errors.name = undefined;
            }
        }

        //validates business name. it is required and accepts any content
        if(field === "businessName" || !field){
            if(!$scope.UserInputData.businessName || $scope.UserInputData.businessName.length === 0 ){
                $scope.UserFormData.errors.businessName = "Your business name is required to get a quote."
            }
            else{
                $scope.UserFormData.errors.businessName = undefined;
            }
        }

        //validates first part of zip code, it is required and must contain 4 digits
        if(field === "zipCode1" || !field){
            if(!$scope.UserInputData.zipCode1 || $scope.UserInputData.zipCode1.legth === 0 ){
                $scope.UserFormData.errors.zipCode1 = "The first part of your zip code must have 4 digits following XXXX pattern."
            }
            else if(!$scope.UserInputData.zipCode1.match(/(^\d{4}$)/)) {
                $scope.UserFormData.errors.zipCode1 = "The first part of your zip code must have 4 digits following XXXX pattern."
            }
            else{
                $scope.UserFormData.errors.zipCode1 = undefined;
            }
        }

        //validates second part of zip code, it is required and must contain 3 digits
        if(field === "zipCode2" || !field){
            if(!$scope.UserInputData.zipCode2 || $scope.UserInputData.zipCode2.legth === 0 ){
                $scope.UserFormData.errors.zipCode2 = "The second part of your zip code must have 3 digits following XXX pattern."
            }
            else if(!$scope.UserInputData.zipCode2.match(/(^\d{3}$)/)) {
                $scope.UserFormData.errors.zipCode2 = "The second part of your zip code must have 3 digits following XXX pattern."
            }
            else{
                $scope.UserFormData.errors.zipCode2 = undefined;
            }
        }

        //validates income field. it is required and must only contain digits
        if(field === "income" || !field){
            if(!$scope.UserInputData.income || $scope.UserInputData.income.length === 0 ){
                $scope.UserFormData.errors.income = "Your income is required to get a quote."
            }
            else if(!$scope.UserInputData.income.match(/^\d+$/)) {
                $scope.UserFormData.errors.income = "Your income must only contain digits."
            }
            else{
                $scope.UserFormData.errors.income = undefined;
            }
        }
        return $scope.GetErrors().length >0 ?  false : true;
    }

    /*
        Return an array with all error messages
    */
    $scope.GetErrors = function(){
        var errors = [];
        for(var key in $scope.UserFormData.errors) {
            if($scope.UserFormData.errors[key]){
                errors.push($scope.UserFormData.errors[key]);
            }
        }
        return errors;
    }
    /*
        Initialize controller
    */
    $scope.Init = function() {
      $("body").scrollTop(0);
      $("select.resizeselect").resizeselect();


    };

    $scope.Init();
}]);
