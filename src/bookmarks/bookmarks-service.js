const BookmarksService = {
  getAllBookmarks(knex) {
    return knex('bookmarks').select('*');
  },
  insertBookmark(knex, newbookmark) {
    return knex('bookmarks')
    .insert(newbookmark)
    .returning('*')
    .then(rows => { return rows[0] });
  },
  getById(knex, id) {
    return knex('bookmarks').select('*').where('id', id).first();
  },
  deleteBookmark(knex, id) {
    return knex('bookmarks').where({ id }).delete();
  },
  updateBookmark(knex, id, newBookmarkFields) {
    return knex('bookmarks').where({ id }).update(newBookmarkFields);
  },
};

module.exports = BookmarksService;