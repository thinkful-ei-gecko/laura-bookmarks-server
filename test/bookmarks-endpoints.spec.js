const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app.js');
const { makeBookmarksArray } = require('./bookmarks.fixtures.js');


describe.only('Bookmarks Endpoints', function() {
  let db;
  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());
  before('clean the table', () => db('bookmarks').truncate());
  afterEach('cleanup', () => db('bookmarks').truncate());

  describe('GET /bookmarks', () => {
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();
      beforeEach('insert bookmarks', () => {
        return db('bookmarks').insert(testBookmarks)
      });  
      it('responds with 200 and all of the bookmarks', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', 'Bearer 999e83d5-ba76-4146-abab-01bef86b6912')
          .expect(200, testBookmarks)
          // TODO: add more assertions about the body
      });
    });
    context(`Given no bookmarks`, () => {
        it(`responds with 200 and an empty list`, () => {
          return supertest(app)
            .get('/bookmarks')
            .set('Authorization', 'Bearer 999e83d5-ba76-4146-abab-01bef86b6912')
            .expect(200, [])
        });
      });
  });

  describe('GET /bookmarks/:bookmark_id', () => {
    context(`Given no bookmarks`, () => {
        it(`responds with 404`, () => {
          const bookmarkId = 2345;
          return supertest(app)
            .get(`/bookmarks/${bookmarkId}`)
            .set('Authorization', 'Bearer 999e83d5-ba76-4146-abab-01bef86b6912')
            .expect(404, { error: { message: `Bookmark does not exist` } })
        });
      });
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();
      beforeEach('insert bookmarks', () => {
        return db('bookmarks').insert(testBookmarks)
      });
      it('responds with 200 and the specified bookmark', () => {
        const bookmarkId = 2;
        const expectedBookmark = testBookmarks[bookmarkId - 1];
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .set('Authorization', 'Bearer 999e83d5-ba76-4146-abab-01bef86b6912')
          .expect(200, expectedBookmark)
      });
    });
  });

});