const express = require('express');
const path = require('path');
const apps = require('./apps.json');

function modifyUrl(appUrl='', isRoot=false) {
    let url = appUrl.trim();
    if (url.endsWith('/')) url = url.slice(0, -1);
    if (isRoot) return url === '' ? '*' : url + '/*';
    else return url;
}


module.exports = (app = express()) => {
    apps.forEach(({ uri, filesPath, isRoot }) => {
        const staticPath = express.static(path.resolve(filesPath));
        const appUrl = modifyUrl(uri, isRoot)
        app.use(uri, staticPath);

        app.get(appUrl , (req, res) => {
            res.sendFile(`${path.resolve(filesPath)}/index.html`);
        })
    });
};