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

module.exports = { makeBookmarksArray }
