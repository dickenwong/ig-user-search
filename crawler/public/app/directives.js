'use strict';


angular.module('app.directives', [])
  .directive('igUserTable', igUserTable)
  .directive('igUserCardGroup', igUserCardGroup)
  .directive('searchForm', searchForm);


function igUserTable() {
  return {
    restrict: 'A',
    scope: {},
    controller: 'SearchResultController',
    controllerAs: 'vm',
    templateUrl: '/build/templates/directives/ig-user-table.html',
  };
}


function igUserCardGroup() {
  return {
    restrict: 'A',
    scope: {},
    controller: 'SearchResultController',
    controllerAs: 'vm',
    templateUrl: '/build/templates/directives/ig-user-card-group.html',
  };
}


function searchForm() {
  return {
    restrict: 'A',
    scope: {},
    controller: 'SearchController',
    controllerAs: 'vm',
    templateUrl: '/build/templates/directives/search-form.html',
  };
}

