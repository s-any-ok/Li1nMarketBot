const kb = require('./keyboard-button');

module.exports = {
    home: [
        [kb.home.films, kb.home.cinemas],
        [kb.home.favourite]
    ],
    film: [
        [kb.film.action, kb.film.camedy],
        [kb.film.random],
        [kb.back ]
    ]
}