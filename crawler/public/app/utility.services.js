'use strict';


angular.module('utility.services', [])
  .factory('wrapPromise', wrapPromise)
  .factory('toAbsUrl', toAbsUrl)
  .factory('shareToFacebook', shareToFacebook)
  .factory('describeTime', describeTime);


function wrapPromise() {
  return (promiseFunc) => {
    return func;

    function func(...args) {
      if (func.$promise) return func.$promise;
      func.$promise = promiseFunc(...args)
        .then(resp => {
          func.$error = null;
          func.$promise = null;
          return resp;
        })
        .catch(resp => {
          func.$error = (resp.data && resp.data.error) || 'Unknown';
          func.$promise = null;
          return Promise.reject(resp);
        });
      return func.$promise;
    }
  };
}


toAbsUrl.$inject = ['$location'];
function toAbsUrl($location) {
  return (relativeUrl) => {
    const protocol = $location.protocol();
    const host = $location.host();
    const port = $location.port();
    const bathPath = port
      ? `${protocol}://${host}:${port}`
      : `${protocol}://${host}`;
    return `${bathPath}${relativeUrl}`;
  };
}


shareToFacebook.$inject = ['$window', 'toAbsUrl'];
function shareToFacebook($window, toAbsUrl) {
  function share(shareUrl, toAbsolute = false) {
    if (toAbsolute) shareUrl = toAbsUrl(shareUrl);
    console.log(shareUrl);
    return new Promise((resolve, reject) => {
      $window.FB.ui(
        {
          method: 'share',
          href: shareUrl,
        },
        response => {
          console.log(response);
          resolve(response);
        }
      );
    });
  }

  return share;
}


function describeTime() {
  const MINUTE = _describe.MINUTE = 1000 * 60;
  const HOUR = _describe.HOUR = MINUTE * 60;
  const DAY = _describe.DAY = HOUR * 24;
  const WEEK = _describe.WEEK = DAY * 7;

  function _describe(timestamp) {
    const date = new Date(timestamp);
    const timeDiff = new Date() - date;
    if (timeDiff >= WEEK) return _toString(WEEK, timeDiff, ' week');
    if (timeDiff >= DAY) return _toString(DAY, timeDiff, ' day');
    if (timeDiff >= HOUR) return _toString(HOUR, timeDiff, ' hr');
    return _toString(MINUTE, timeDiff, ' min');
  }

  function pluralize(unit) {
    return `${unit}s`;
  }

  function _toString(TIME_TYPE, timeDiff, unit) {
    const count = Math.floor(timeDiff / TIME_TYPE);
    if (count > 1) unit = pluralize(unit);
    return `${count}${unit}`;
  }

  return _describe;
}
