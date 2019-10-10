function makeBookmarksArray() {
  return [
    { id: 1,
      title: 'UMN',
      url: 'https://umn.edu',
      description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.',
      rating: '5'
    },
    { id: 2,
      title: 'Funny site',
      url: 'https://funnysite.com',
      description: 'Natus consequuntur deserunt commodi',
      rating: '1'
    },
    { id: 3,
      title: 'MCTC',
      url: 'https://minneapolis.edu',
      description: 'nobis qui inventore corrupti iusto aliquid debitis unde non.',
      rating: '4'
    },
    { id: 4,
      title: 'Odd site',
      url: 'https://odd.com',
      description: 'Adipisci, pariatur. Molestiae, libero esse hic adipisci autem neque?',
      rating: '3'
    }
  ];
}

function makeMaliciousBookmark() {
  const maliciousBookmark = {
    id: 911,
    url: 'https://url.to.file.which/does-not.exist',
    title: 'Naughty <script>alert("xss");</script>',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    rating: '5'
  }
  const expectedBookmark = {
    ...maliciousBookmark,
    title: 'Naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
  }
  return {
    maliciousBookmark,
    expectedBookmark
  }
};

module.exports = { makeBookmarksArray, makeMaliciousBookmark };
