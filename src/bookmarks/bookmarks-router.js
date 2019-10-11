const express = require('express');
const path = require('path');
//const uuid = require('uuid/v4');
const { isWebUri } = require('valid-url');
//const logger = require('../logger');
// const store = require('./bookmarks.js');
const xss = require('xss');
const BookmarksService = require('./bookmarks-service.js');

const bookmarksRouter = express.Router();
const jsonParser = express.json();

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  url: bookmark.url,
  title: xss(bookmark.title), // sanitize title
  description: xss(bookmark.description), // sanitize content
  rating: bookmark.rating
});

bookmarksRouter
  .route('/')
  .get((req, res, next) => {
    BookmarksService.getAllBookmarks(req.app.get('db'))
    .then(bookmarks => { 
      res.json(bookmarks.map(serializeBookmark))
    })
    .catch(next)  
  })
  .post(jsonParser, (req, res, next) => {
    const { title, url, description, rating } = req.body;
    const newBookmark = { title, url, description, rating };
    const requiredFields = { title, url, rating };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (value == null) {
        return res.status(400).json({ error: { message: `Missing '${key}' in request body` } });
      }
    }
    if (!isWebUri(url)) {
      return res.status(400).json({ error: { message: `URL must have valid format` } });
    } //FUTURE: WRITE A TEST FOR THIS PIECE***************************

    BookmarksService.insertBookmark( req.app.get('db'), newBookmark )
      .then(bookmark => {
        res.status(201)
         .location(path.posix.join(req.originalUrl +`/${bookmark.id}`))  
         .json(serializeBookmark(bookmark))
      })
      .catch(next)
    })

  /*    for (const field of ['title', 'url', 'rating']) {
      if (!req.body[field]) {
        logger.error(`${field} is required`);
        return res.status(400).send(`'${field}' is required`);
      }
    }
    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      logger.error(`Invalid rating '${rating}' supplied`);
      return res.status(400).send(`'rating' must be a number between 0 and 5`);
    }
    const bookmark = { id: uuid(), title, url, description, rating };
    store.push(bookmark);
    logger.info(`Bookmark with id ${bookmark.id} created`);
    res.status(201).location(`http://localhost:8000/bookmarks/${bookmark.id}`).json(bookmark);
  */

bookmarksRouter
  .route('/:bookmark_id')
  .all((req, res, next) => {
    BookmarksService.getById( req.app.get('db'), req.params.bookmark_id )
      .then(bookmark => {
        if (!bookmark) {
          return res.status(404).json({ error: { message: `Bookmark does not exist` } })
        }
        res.bookmark = bookmark // save the bookmark for the next middleware
        next() // don't forget to call next so the next middleware happens!
      })
      .catch(next)
  })
  .get((req, res, next) => {
        return res.json({
          id: res.bookmark.id,
          url: res.bookmark.url,
          title: xss(res.bookmark.title), // sanitize title
          description: xss(res.bookmark.description), // sanitize content
          rating: res.bookmark.rating
        }) 
  })
  .delete((req, res, next) => {
    BookmarksService.deleteBookmark( req.app.get('db'), req.params.bookmark_id )
    .then(() => { res.status(204).end() })
    .catch(next)
  })
  .patch(jsonParser, (req, res, next) => {
    const { title, url, description, rating } = req.body;
    const bookmarkToUpdate = { title, url, description, rating };
    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length;
    if (numberOfValues === 0) {
      return res.status(400).json({ error: {
          message: `Request body must contain 'title', 'url', 'description' or 'rating'`
        }
      })
    }

    BookmarksService.updateBookmark( req.app.get('db'), 
                                     req.params.bookmark_id,
                                     bookmarkToUpdate)
      .then(numRowsAffected => { res.status(204).end() })
      .catch(next)
  })

/*    const { bookmark_id } = req.params;
    const bookmark = store.find(c => c.id == bookmark_id);
    if (!bookmark) {
      logger.error(`Bookmark with id ${bookmark_id} not found.`);
      return res.status(404).send('Bookmark Not Found');
    }
    res.json(bookmark); */


/*  .delete('/:bookmark_id', (req, res) => {
    const { bookmark_id } = req.params;
    const bookmarkIndex = store.findIndex(b => b.id === bookmark_id);

    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${bookmark_id} not found.`);
      return res.status(404).send('Bookmark Not Found');
    }

    store.splice(bookmarkIndex, 1);
    logger.info(`Bookmark with id ${bookmark_id} deleted.`);
    res.status(204).end(); 
  }); */

module.exports = bookmarksRouter;