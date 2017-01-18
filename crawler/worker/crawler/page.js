'use strict';

const Agent = require('socks5-https-client/lib/Agent');
let request = require('request-promise');
const { StatusCodeError } = require('request-promise/errors');
const { ResourceNotFound } = require('./errors');


if (process.env.TOR) {
  request = request.defaults({
    strictSSL: true,
    agentClass: Agent,
    agentOptions: {
      socksHost: process.env.TOR_HOST || 'localhost',
      socksPort: process.env.TOR_PORT || 9050,
    },
  });
}


class Page {
  *loadInitial(endpoint) {
    endpoint = encodeURIComponent(endpoint);
    const jar = request.jar();
    const config = {
      jar,
      method: 'get',
      url: `https://www.instagram.com/${endpoint}`,
    };
    return request(config)
      .then(html => {
        const pattern = /window\._sharedData\s*=\s*(((?!};\s*<\/script>).)*})/;
        const match = html.match(pattern);
        if (!match) throw new ResourceNotFound();

        const initial = JSON.parse(match[1]);
        if (Object.keys(initial.entry_data).length === 0) {
          throw new ResourceNotFound();
        }

        const cookies = jar.getCookies('https://www.instagram.com');
        const csrftoken = cookies.find(cookie => cookie.key === 'csrftoken');
        this.api = {
          jar,
          csrftoken,
          queryRequest: request.defaults({
            jar,
            method: 'post',
            url: 'https://www.instagram.com/query/',
            json: true,
            headers: {
              referer: `https://www.instagram.com/${endpoint}`,
              origin: 'https://www.instagram.com',
              'x-csrftoken': csrftoken.value,
              'x-instagram-ajax': '1',
              'x-requested-with': 'XMLHttpRequest',
            },
          }),
        };
        return initial;
      })
      .catch(StatusCodeError, () => { throw new ResourceNotFound(); });
  }

  toData(instance, properties) {
    const data = {};
    properties.forEach(prop => { data[prop] = instance[prop]; });
    return data;
  }
}

module.exports = Page;
