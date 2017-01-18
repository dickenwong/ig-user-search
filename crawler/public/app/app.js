'use strict';

angular
  .module('app', [
    'ngTable',
    'utility.services',
    'app.services',
    'app.controllers',
    'app.directives',
  ])
  .config(config);

config.$inject = ['$interpolateProvider'];
function config($interpolateProvider) {
  $interpolateProvider.startSymbol('{$');
  $interpolateProvider.endSymbol('$}');
}
