const kb = require('./keyboard-button');

module.exports = {
    home: [
        [kb.home.films, kb.home.cinemas],
        [kb.home.favourite]
    ],
    film: [
        [kb.film.action, kb.film.comedy],
        [kb.film.random],
        [kb.back ]
    ],
}