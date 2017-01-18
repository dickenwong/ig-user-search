'use strict';

const express = require('express');
const { crawl, clearRecords, clearAllRecords, countRecords,
        listRecords } = require('../worker/crawl');

const router = express.Router(); // eslint-disable-line new-cap


/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' });
});


router.post('/crawl', (req, res, next) => {
  console.log(req.body);
  const crawlPostCount = Number(req.body.crawlPostCount);
  crawl(req.body.tag, req.body, crawlPostCount || 500)
    .then(result => res.json(result))
    .catch(next);
});


router.post('/clear', (req, res, next) => {
  if (!req.body.tag) {
    res.status(400).send('Tag is invalid');
    return;
  }
  clearRecords(req.body.tag.trim())
    .then(result => res.sendStatus(200))
    .catch(next);
});


router.post('/clearAll', (req, res, next) => {
  clearAllRecords()
    .then(() => res.sendStatus(200))
    .catch(next);
});


router.get('/countRecords', (req, res, next) => {
  countRecords()
    .then((tagRecordCounts) => res.json(tagRecordCounts))
    .catch(next);
});


router.get('/listRecords', (req, res, next) => {
  listRecords(req.query.tag)
    .then(igUsers => res.json({ igUsers }))
    .catch(next);
});


module.exports = router;
