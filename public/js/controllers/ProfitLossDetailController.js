angular.module('finapp').controller('ProfitLossDetailController', function ($scope, $http) {
  console.log('logging from ProfitLossDetailController');
  $scope.data = null;

  $scope.saveAll = function saveAll (tables) {
    console.log($scope.data.tables[0].rows[0]);
    // var postRequest = $http({
    //   method: 'POST',
    //   url: '/profit-loss-detail',
    //   data: {
    //     tables: $scope.data.tables,
    //     columns: $scope.data.columns.Column
    //   }
    // });

    // postRequest.then(
    //   function success (response) {
    //     console.log(response);
    //   },
    //   function fail (response) {
    //     console.log(response);
    //   }
    // );
  };

  // $scope.save = function saveTable (table) {
  //   console.log('table was passed by');
  //   console.log(table);
  //   console.log('%s was saved', table.title.value);

  //   // var request = $http({
  //   //   method: 'POST',
  //   //   url: '/',
  //   //   data: $scope.data.tables
  //   // });

  //   // request.then(
  //   //   function success (response) {

  //   //   },
  //   //   function error (response) {

  //   //   }
  //   // );
  // };

  var request = $http({
    method: 'POST',
    url: '/data/profit-loss-detail'
  });

  request.then(
    function success (response) {
      safeApply($scope, function () {
        $scope.data = response.data.data;
        $scope.customDataColumn = [];
        console.log($scope.data.tables);

        setTimeout(function () {
          $('table').editableTableWidget();

          $('table td').on('change', function(evt, newValue) {
            console.log('new value changed!!!');
            console.log(newValue);

            console.log('evt:' );
            console.log(evt);

            $scope.$digest();
          }); 
        }, 2000);
        
      });
    },
    function error (response) {
      console.log(response.error);
    }
  );



  function safeApply(scope, fn) {
    (scope.$$phase || scope.$root.$$phase) ? fn() : scope.$apply(fn);
  }
});