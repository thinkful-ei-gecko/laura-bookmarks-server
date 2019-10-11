const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app.js');
const { makeBookmarksArray, makeMaliciousBookmark } = require('./bookmarks.fixtures.js');


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

  describe('GET /api/bookmarks', () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set('Authorization', 'Bearer 999e83d5-ba76-4146-abab-01bef86b6912')
          .expect(200, [])
      });
    });
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();
      beforeEach('insert bookmarks', () => {
        return db('bookmarks').insert(testBookmarks)
      });  
      it('responds with 200 and all of the bookmarks', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set('Authorization', 'Bearer 999e83d5-ba76-4146-abab-01bef86b6912')
          .expect(200, testBookmarks)
          // TODO: add more assertions about the body??
      });
    });
    context(`Given an XSS attack bookmark`, () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();
      beforeEach('insert malicious bookmark', () => {
          return db('bookmarks').insert([ maliciousBookmark ])
      });
      it('removes XSS attack content', () => {
        return supertest(app).get(`/api/bookmarks`)
          .set('Authorization', 'Bearer 999e83d5-ba76-4146-abab-01bef86b6912')
          .expect(200)
          .expect(res => {
            expect(res.body[0].title).to.eql(expectedBookmark.title)
            expect(res.body[0].description).to.eql(expectedBookmark.description)
          })
      });
    });

  });

  describe('GET /api/bookmarks/:bookmark_id', () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 2345;
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
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
          .get(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', 'Bearer 999e83d5-ba76-4146-abab-01bef86b6912')
          .expect(200, expectedBookmark)
      });
    });
    context(`Given an XSS attack article`, () => {
      const maliciousBookmark = {
        id: 911,
        title: 'Naughty <script>alert("xss");</script>',
        url: 'https://url.to.file.which/does-not.exist',
        rating: '5',
        description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
      }
      beforeEach('insert malicious bookmark', () => {
        return db('bookmarks')
          .insert([ maliciousBookmark ])
      })
      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/bookmarks/${maliciousBookmark.id}`)
          .set('Authorization', 'Bearer 999e83d5-ba76-4146-abab-01bef86b6912')
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql('Naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
            expect(res.body.description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
          });
      });
    });
  });

  describe(`POST /api/bookmarks`, () => {
    it(`creates a bookmark, responding with 201 and the new bookmark`,  function() {
      const newBookmark = { title: 'Bad site',
                            url: 'https://badsite.com',
                            description: 'Molestiae, libero esse hic adipisci autem neque?',
                            rating: '1' };
      return supertest(app)
        .post('/api/bookmarks')
        .send(newBookmark)
        .set('Authorization', 'Bearer 999e83d5-ba76-4146-abab-01bef86b6912')
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title)
          expect(res.body.url).to.eql(newBookmark.url)
          expect(res.body.description).to.eql(newBookmark.description)
          expect(res.body.rating).to.equal(newBookmark.rating)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`)
        })
        .then(postRes =>
          supertest(app)
            .get(`/api/bookmarks/${postRes.body.id}`)
            .set('Authorization', 'Bearer 999e83d5-ba76-4146-abab-01bef86b6912')
            .expect(postRes.body)
        )
    });
    it(`responds with 400 and an error message when the 'title' is missing`, () => {
      return supertest(app)
        .post('/api/bookmarks')
        .send({ url: 'https://badsite.com',
                rating: '1' })
        .set('Authorization', 'Bearer 999e83d5-ba76-4146-abab-01bef86b6912')
        .expect(400, { error: { message: `Missing 'title' in request body` } })
    });
    it(`responds with 400 and an error message when the 'url' is missing`, () => {
      return supertest(app)
        .post('/api/bookmarks')
        .send({ title: 'Bad site',
                rating: '1' })
        .set('Authorization', 'Bearer 999e83d5-ba76-4146-abab-01bef86b6912')
        .expect(400, { error: { message: `Missing 'url' in request body` } })
    });
    it(`responds with 400 and an error message when the 'rating' is missing`, () => {
      return supertest(app)
        .post('/api/bookmarks')
        .send({ url: 'https://badsite.com',
                title: 'Bad site' })
        .set('Authorization', 'Bearer 999e83d5-ba76-4146-abab-01bef86b6912')
        .expect(400, { error: { message: `Missing 'rating' in request body` } })
    });
    it(`responds with 400 and an error message when the url is not valid`, () => {
      return supertest(app)
        .post('/api/bookmarks')
        .send({ url: 'badsite.com',
                title: 'Bad site',
                rating: '2'})
        .set('Authorization', 'Bearer 999e83d5-ba76-4146-abab-01bef86b6912')
        .expect(400, { error: { message: `URL must have valid format` } })
    });

    it('removes XSS attack content from response', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();
      return supertest(app).post(`/api/bookmarks`)
        .send(maliciousBookmark)
        .set('Authorization', 'Bearer 999e83d5-ba76-4146-abab-01bef86b6912')
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(expectedBookmark.title)
          expect(res.body.description).to.eql(expectedBookmark.description)
        });
    });
  });

  describe(`DELETE /api/bookmarks/:bookmark_id`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 123456;
        return supertest(app)
          .delete(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', 'Bearer 999e83d5-ba76-4146-abab-01bef86b6912')
          .expect(404, { error: { message: `Bookmark does not exist` } })
      });
    });
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();
      beforeEach('insert bookmarks', () => {
        return db('bookmarks').insert(testBookmarks)
      })
      it('responds with 204 and removes the bookmark', () => {
        const idToRemove = 2
        const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
        return supertest(app)
          .delete(`/api/bookmarks/${idToRemove}`)
          .set('Authorization', 'Bearer 999e83d5-ba76-4146-abab-01bef86b6912')
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/bookmarks`)
              .set('Authorization', 'Bearer 999e83d5-ba76-4146-abab-01bef86b6912')
              .expect(expectedBookmarks)
          )
      });
    });
  });

  describe.only(`PATCH /api/bookmarks/:bookmark_id`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 123456;
        return supertest(app)
          .patch(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', 'Bearer 999e83d5-ba76-4146-abab-01bef86b6912')
          .expect(404, { error: { message: `Bookmark does not exist` } })
      });
    });
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();
      beforeEach('insert bookmarks', () => {
        return db('bookmarks').insert(testBookmarks)
      });
      it('responds with 204 and updates the bookmark', () => {
        const idToUpdate = 2;
        const updateBookmark = {
          title: 'updated bookmark title',
          url: 'https://new.url',
          description: 'updated bookmark description',
          rating: '2'
        };
        const expectedBookmark = {
          ...testBookmarks[idToUpdate -1],
          ...updateBookmark
        };
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send(updateBookmark)
          .set('Authorization', 'Bearer 999e83d5-ba76-4146-abab-01bef86b6912')
          .expect(204)
          .then(res => 
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .set('Authorization', 'Bearer 999e83d5-ba76-4146-abab-01bef86b6912')
              .expect(expectedBookmark)
              )
      });
      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2;
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send({ irrelevantField: 'foo' })
          .set('Authorization', 'Bearer 999e83d5-ba76-4146-abab-01bef86b6912')
          .expect(400, {
            error: { message: `Request body must contain 'title', 'url', 'description' or 'rating'`}
          })
      });
      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2;
        const updateBookmark = { title: 'updated bookmark title' };
        const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updateBookmark
        };
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send({
            ...updateBookmark,
            fieldToIgnore: 'should not be in GET response'
          })
          .set('Authorization', 'Bearer 999e83d5-ba76-4146-abab-01bef86b6912')
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .set('Authorization', 'Bearer 999e83d5-ba76-4146-abab-01bef86b6912')
              .expect(expectedBookmark)
          )
      });
    });

  });

});


