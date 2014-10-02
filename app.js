(function(){
    var app = angular.module("finportal", []);


    app.controller('ApiController', function(){
        this.person = gem;

    });

    var gem ={
        name: "Rishi",
        lastname: "Ghan",
        isSingle: true
    };

})();
