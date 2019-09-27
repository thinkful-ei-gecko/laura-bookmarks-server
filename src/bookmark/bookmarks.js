const uuid  = require('uuid/v4');

const bookmarks = [
  {
    id: uuid(),
    title: 'Bookmark 1',
    url: 'www.bookmark1.com',
    content: 'flsdajf;dsfksjf;ajda;'
  },
  {
    id: uuid(),
    title: 'Bookmark 2',
    url: 'www.bookmark2.com',
    content: 'flsdajf;dsfksjf;ajda;'
  }
];

module.exports = bookmarks;