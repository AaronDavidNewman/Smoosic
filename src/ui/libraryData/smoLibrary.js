class DefaultLibrary {
  static get libraries() {
    const rv = [
      { metadata: [
        { name: 'Handel''s Messiah' },
        { tags: ['Sacred Oratorio', 'Religious Music'] },
        { composer: 'GF Handel' }
      ]
      children: [
        { url: 'https://aarondavidnewman.github.io/Smoosic/release/library/Messiah Pt 1-1.json',
          urlFormat: 'smoosic',
          metadata: [
            { name: 'Sinfonia' },
            { source: 'https://imslp.org/wiki/Messiah,_HWV_56_(Handel,_George_Frideric)' },
            { movement: 'I-I' }
          }
        ]
      ]
        nodes: [

        ],
          { name: 'Recitativo: Comfort ye, my people', format: 'smoosic', source: 'https://imslp.org/wiki/Messiah,_HWV_56_(Handel,_George_Frideric)' }
        ]}
    ];
  }
}
