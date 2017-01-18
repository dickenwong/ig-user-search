'use strict';


angular.module('app.services', ['utility.services'])
  .factory('igUserSearcher', igUserSearcher);


igUserSearcher.$inject = ['$http', 'wrapPromise', '$timeout', '$window'];
function igUserSearcher($http, wrapPromise, $timeout, $window) {
  const self = this;
  self.igUsers = [];
  self.apiCallCount = null;
  self.tagRecordCounts = {};

  self.crawl = wrapPromise((data, e) => {
    if (e) e.preventDefault();
    console.log(data);
    return $http.post('/crawl', data)
      .then(resp => {
        setNewIgUsers(resp.data.igUsers);
        self.apiCallCountInLastHour = data.apiCalledInLastHour;
        $window.alert(
          `${resp.data.crawledPostCount} posts have been crawled.\n` +
          `${self.igUsers.length} profiles match the search criteria.`
        );
        return self.countRecords();
      })
      .catch(handleApiError);
  });


  self.listRecords = wrapPromise((tag, e) => {
    if (e) e.preventDefault();
    return $http.get('/listRecords', { params: { tag } })
      .then(resp => {
        setNewIgUsers(resp.data.igUsers);
        // $window.alert(`${self.igUsers.length} profiles are fetched.`);
      })
      .catch(handleApiError);
  });


  self.countRecords = wrapPromise((e) => {
    if (e) e.preventDefault();
    return $http.get('/countRecords')
      .then(resp => {
        for (const tag of Object.keys(self.tagRecordCounts)) {
          delete self.tagRecordCounts[tag];
        }
        Object.assign(self.tagRecordCounts, resp.data);
      })
      .catch(handleApiError);
  });


  self.clearRecords = wrapPromise((tag, e) => {
    if (e) e.preventDefault();
    return $http.post('/clear', { tag })
      .then(resp => {
        $window.alert(`Cleared #${tag}.`);
        return self.countRecords();
      })
      .catch(handleApiError);
  });


  self.clearAllRecords = wrapPromise((e) => {
    if (e) e.preventDefault();
    return $http.post('/clearAll')
      .then(resp => {
        $window.alert('Cleared all tags.');
        return self.countRecords();
      })
      .catch(handleApiError);
  });

  self.countRecords();
  return self;

  function uniqueBy(arr, key) {
    const seen = {};
    return arr.filter((item) => {
      const k = item[key];
      return Object.prototype.hasOwnProperty.call(seen, k)
        ? false
        : (seen[k] = true);
    });
  }

  function setNewIgUsers(igUsers) {
    igUsers = uniqueBy(igUsers, 'username');
    igUsers.forEach((user, i) => { user.index = i + 1; });
    self.igUsers.splice(0, self.igUsers.length);
    self.igUsers.push(...igUsers);
    $timeout(() => {
      $window.instgrm.Embeds.process();
    }, 100, false);
  }

  function handleApiError(err) {
    console.error(err);
    $window.alert('ERROR!');
    $window.alert(err.message || JSON.stringify(err));
    $window.lastApiError = err;
  }
}
