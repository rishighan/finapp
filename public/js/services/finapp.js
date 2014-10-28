angular.module('finappservice', [])

  .factory('finapp', function($http){
    return{
        get: function(){
            return $http.get('/api/vendorbalancedetails');
        }
    }


  });
