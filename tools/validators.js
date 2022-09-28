const mongoose = require('mongoose');

module.exports = {
    isValidObjectId: value => {
        let valueId;
        try {
            valueId = new mongoose.Types.ObjectId(value);
        }catch {
            valueId = false;
        }
        return value == valueId;
    }
};