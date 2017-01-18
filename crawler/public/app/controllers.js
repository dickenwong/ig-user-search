'use strict';

const $ = jQuery;

angular.module('app.controllers', ['ngTable', 'app.services'])
  .controller('MainController', MainController)
  .controller('SearchResultController', SearchResultController)
  .controller('SearchController', SearchController);


MainController.$inject = ['$scope', 'NgTableParams', '$timeout', '$window'];
function MainController($scope, NgTableParams, $timeout, $window) {
  const self = this;
  self.result = null;

  self.init = () => {
    self.countRecords();
  };

  self.crawl = (e) => {
    if (e) e.preventDefault();
    if (self.crawling) return;
    self.crawling = true;
    $.ajax({
      method: 'POST',
      url: '/crawl',
      data: $('#form').serialize(),
      success: (data) => {
        self.igUsers = showRecords(data.igUsers);
        self.crawling = false;
        self.apiCallCount = data.apiCalledInLastHour;
        self.countRecords();
        alert(data.crawledPostCount + ' posts have been crawled.\n' +
              self.igUsers.length + ' profiles have been found in total.');
      },
      error: (err) => {
        self.crawling = false;
        console.error(err);
        alert('Error!');
        alert(err.responseText);
      },
    });
  };

  self.clearRecords = (e, tag) => {
    if (e) e.preventDefault();
    $.ajax({
      method: 'POST',
      url: '/clear',
      data: { tag },
      success: (data) => {
        alert('Cleared!');
        self.countRecords();
      },
      error: (err) => {
        console.error(err);
        alert('Error!');
        alert(err.responseText);
      },
    });
  };

  self.clearAllRecords = (e) => {
    if (e) e.preventDefault();
    $.ajax({
      method: 'POST',
      url: '/clearAll',
      success: (data) => {
        alert('Cleared All!');
        self.countRecords();
      },
      error: (err) => {
        console.error(err);
        alert('Error!');
        alert(err.responseText);
      },
    });
  };

  self.countRecords = (e) => {
    if (e) e.preventDefault();
    $.ajax({
      method: 'GET',
      url: '/countRecords',
      success: (data) => {
        self.tagRecordCounts = data;
        $scope.$apply();
      },
      error: (err) => {
        console.error(err);
        alert('Error!');
        alert(err.responseText);
      }
    });
  };

  self.listRecords = (e, tag) => {
    if (e) e.preventDefault();
    if (self.crawling) return;
    self.crawling = true;
    $.ajax({
      method: 'GET',
      url: '/listRecords',
      data: { tag },
      success: (data) => {
        self.igUsers = showRecords(data.igUsers);
        self.crawling = false;
        self.countRecords();
        alert(self.igUsers.length + ' profile records are fetched.');
      },
      error: (err) => {
        self.crawling = false;
        console.error(err);
        alert('Error!');
        alert(err.responseText);
      },
    });
  };

  function showRecords(igUsers) {
    igUsers = uniqueBy(igUsers, 'username');
    igUsers.forEach((user, i) => { user.index = i + 1; });
    self.tableParams = new NgTableParams(
      { count: 999999 },
      { dataset: igUsers, counts: [] }
    );
    $scope.$apply();
    $timeout(() => { $window.instgrm.Embeds.process(); }, 100, false);
    return igUsers;
  }
}


function uniqueBy(arr, key) {
  const seen = {};
  return arr.filter((item) => {
    const k = item[key];
    return seen.hasOwnProperty(k) ? false : (seen[k] = true);
  });
}


SearchResultController.$inject = ['$scope', 'igUserSearcher', '$window', '$timeout'];
function SearchResultController($scope, igUserSearcher, $window, $timeout) {
  this.userLists = igUserSearcher.igUsers;

  this.display = {
    page: 0,
    count: 36,
  };

  this.canShow = ($index) => {
    const startIndex = this.display.page * this.display.count;
    return $index >= startIndex && $index < startIndex + this.display.count;
  };

  this.pageCount = () => (
    Math.ceil(this.userLists.length / this.display.count)
  );

  this.pages = () => [...Array(this.pageCount()).keys()];

  this.toPage = (pageNum) => {
    this.display.page = pageNum;
    this.fetchIgIframe();
    $window.EPPZScrollTo.scrollVerticalToElementById('igUserSearchResults', 50);
  };

  this.isPageActive = (pageNum) => pageNum === this.display.page;

  this.isLastPage = (pageNum) => pageNum === this.pageCount() - 1;

  this.fetchIgIframe = () => {
    $timeout(() => {
      $window.instgrm.Embeds.process();
    }, 100, false);
  };

  this.sortBy = (sortBy) => {
    let sortFunc;
    switch (sortBy) {
      case this.sortBy.DATE:
        sortFunc = (a, b) => (
          Date.parse(b.post.date) > Date.parse(a.post.date) ? 1 : -1
        );
        break;
      case this.sortBy.LIKE:
        sortFunc = (a, b) => (b.post.likeCount > a.post.likeCount ? 1 : -1);
        break;
      default:
    }
    this.userLists.sort(sortFunc);
    this.fetchIgIframe();
  };

  this.sortBy.DATE = 'date';
  this.sortBy.LIKE = 'like';
}


SearchController.$inject = ['$scope', 'igUserSearcher'];
function SearchController($scope, igUserSearcher) {
  this.igUserSearcher = igUserSearcher;
  this.searchRecords = igUserSearcher.tagRecordCounts;
}
