const path = require('path');
const Role = require('../models/users/role.model');

module.exports = async role => {
    const url = [];
    while (role) {
        try {
            role = await Role.findOne({ name: role });
            if (!role) {
                break;
            }
            url.push(role.name.split(' ').join('_'));
            role = role.parent;
        } catch (error) {
            console.log(error);
            break;
        }

    }
    if (!url) {
        return null;
    }
    return path.join(...url.reverse());
};