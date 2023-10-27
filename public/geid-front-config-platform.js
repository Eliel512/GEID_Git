const express = require('express');
const path = require('path');
const routes = require('./router.json');
const surveyService = require('./survey-service');

module.exports = (app = express()) => {
    surveyService(app, () => {
        routes.forEach(route => {
            const {url: _url, path: _path, isRoot} = route;
                app.use(_url || "/", express.static(path.resolve(_path)));
            app.get((_url ? (isRoot ? _url + '/*': _url) : null) || "*", (req, res) => {
                res.sendFile(`${path.resolve(_path)}/index.html`);
            })
        });
    });
};
