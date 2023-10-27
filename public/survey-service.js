const express = require('express');
const { Storage } = require('megajs');
const megaLogin = require('../survey.login.mega.json');
const { Readable } = require('stream');

const EMAIL = megaLogin.EMAIL;
const PASS_WORD = megaLogin.PASS_WORD;

const storage = async () => {
    const storage = await new Storage({
        email: EMAIL,
        password: PASS_WORD,
        autoload: true,
        keepalive: true,
    }).ready;
    return storage;
};

async function checkUser(storage, numbers) {
    if(!Array.isArray(numbers)) throw Error('numbers must be an array');
    const folder = storage.root.children.find(file => file.name === 'MEGA');
    const file = folder.children.find(file => file.name === 'users.json');
    if (!file) throw new Error('users.json not found');
    const data = await file.downloadBuffer();
    const users = JSON.parse(data.toString());
    if (!Array.isArray(users)) 
        throw new Error('users.json does not contain an array');
    return numbers?.some(number => users.includes(number));
}

const uploadFile = async (storage, {name, data}) => {
    const rootFolder = storage.root.children.find(file => file.name === 'MEGA');
    const folder = rootFolder.children.find(file => file.name === 'users_data');
    const stream = Readable.from(data);
    return await folder.upload({
        name, 
        size:  Buffer.byteLength(data)
     }, stream).complete;
};
async function createDataFile(storage, {numbers, data}) {
    if(!Array.isArray(numbers)) throw Error('numbers must be an array');
    if(typeof data !== 'object') throw Error('data must be an object');
    const rootFolder = storage.root.children.find(file => file.name === 'MEGA');
    const folder = rootFolder.children.find(file => file.name === 'users_data');
    const file = rootFolder.children.find(file => file.name === 'users.json');
    const _data = await file.downloadBuffer();
    const users = JSON.parse(_data.toString());

    if (!folder && !file) 
        throw new Error('Folder users_data not found');

    if (!Array.isArray(users)) 
        throw new Error('users.json does not contain an array');

    if(numbers.every(num => !users.includes(num))) {
        users.push(...numbers);
        await file.delete(true);
        const data = JSON.stringify(users);
        const stream = Readable.from(data);
        await rootFolder.upload({
            name: 'users.json',
            size: Buffer.byteLength(data),
        }, stream).complete;
    }
    const [num] = Array.isArray(numbers) ? numbers : numbers?.toString()?.trim();
    return await uploadFile(storage, {
        name: `${num}_user.json`,
        data: JSON.stringify(data),
    });
}


module.exports = (app = express(), callback) => {
    storage().then((storage) => {

        app.get('/surveyservice', (req, res) => {
            res.json({
                message: 'welcome !'
            });
        });
    
        app.post('/surveyservice/check', (req, res) => {
            checkUser(storage, req.body.numbers).then(data => {
                res.json({
                    message: data ? 'User already exists' : 'User does not exist yet',
                    data,
                });
            }).catch(error => {
                console.error(error);
                res.status(400);
                res.json({message: 'Error !'});
            })
           
        });
    
        app.post('/surveyservice/save', (req, res) => {
            createDataFile(storage, req.body).then(data => {
                res.json({
                    message: data ? 'File saved' : 'File not saved',
                    data: Boolean(data),
                });
            }).catch(error => {
                console.error(error);
                res.status(400);
                res.json({message: 'Error !'});
            })
        });
        console.log('Survey service with mega turn on');
        if(typeof callback === 'function') callback();
    }).catch(error => {
        console.error(error);
        //process.exit(1);
    });
};
