const express = require('express');
const path = require('path');
const apps = require('./apps.json');

const modifyUrl = (appUrl='', isRoot=false) => {
    let url = appUrl.trim();
    url = url.endsWith('/') ?  url.slice(0, -1) : url;
    return isRoot ? (url === '' ? '*' : url + '/*') : url;
}


module.exports = (app = express()) => {
    apps.forEach(({ uri, filesPath, isRoot }) => {
        const staticPath = express.static(path.resolve(filesPath));
        const appUrl = modifyUrl(uri, isRoot);
        app.use(uri, staticPath);
        app.get(appUrl , (req, res) => {
            res.sendFile(`${path.resolve(filesPath)}/index.html`);
        });
    });
};
