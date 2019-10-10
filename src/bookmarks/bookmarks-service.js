const BookmarksService = {
  getAllBookmarks(knex) {
    return knex('bookmarks').select('*');
  },
  insertbookmark(knex, newbookmark) {
    return knex('bookmarks')
    .insert(newbookmark)
    .returning('*')
    .then(rows => { return rows[0] });
  },
  getById(knex, id) {
    return knex('bookmarks').select('*').where('id', id).first();
  },
  deletebookmark(knex, id) {
    return knex('bookmarks').where({ id }).delete();
  },
  updatebookmark(knex, id, newbookmarkFields) {
    return knex('bookmarks').where({ id }).update(newbookmarkFields);
  },
};

module.exports = BookmarksService;