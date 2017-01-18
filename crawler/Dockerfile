FROM node:7.0

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y vim tor
COPY torrc /etc/tor/torrc

# COPY package.json /usr/src/app/package.json
# RUN npm install --unsafe-perm
# RUN npm cache clean

CMD service tor start && npm start