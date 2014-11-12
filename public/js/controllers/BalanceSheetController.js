angular.module('finapp').controller('BalanceSheetController', function ($scope, $http, Utility) {
	console.log('logging from ProfitLossDetailController');
    $scope.data = null;

  $scope.saveAll = function saveAll (tables) {
    var tablesConverted = Utility.getDataToSendToServer($scope.data, $scope.grids);
    var postRequest = $http({
      method: 'POST',
      url: '/balance-sheet',
      data: {
        tables: tablesConverted,
        columns: $scope.columns,
        customColumns: $scope.customColumns
      }
    });

    postRequest.then(
      function success (response) {
        console.log(response);
      },
      function fail (response) {
        console.log(response);
      }
    );
  };

  var request = $http({
    method: 'POST',
    url: '/data/balance-sheet'
  });

  request.then(
    function success (response) {
      console.log('response.data.data.tables.length: ');
      console.log(response.data.data.tables.length);
      Utility.safeApply($scope, function () {
        $scope.grids = [];
        $scope.data = [];
        $scope.dataConverted = [];

        $scope.columns = response.data.data.columns.Column;
        $scope.customColumns = response.data.data.customColumns;
        var tables = response.data.data.tables;

        $scope.data = Utility.getDataBasedOnTableFormat($scope.columns, tables);
        $scope.grids = Utility.getGridasedOnTableFormat('data', $scope.columns, tables);

        console.log('$scope.data: ');
        console.log($scope.data);
        console.log('$scope.grids: ');
        console.log($scope.grids);
      });
    },
    function error (response) {
      console.log(response.error);
    }
  );
});