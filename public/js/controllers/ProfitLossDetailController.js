angular.module('finapp').controller('ProfitLossDetailController', function ($scope, $http) {
  console.log('logging from ProfitLossDetailController');
  $scope.data = null;

  var request = $http({
    method: 'POST',
    url: '/data/profit-loss-detail'
  });

  request.then(
    function success (response) {
      safeApply($scope, function () {
        $scope.data = response.data.data;
        console.log('$scope.data.reportName: ');
        console.log($scope.data.reportName);
        console.log('$scope.data.dateRange: ');
        console.log($scope.data.dateRange);
        $('table').editableTableWidget();
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