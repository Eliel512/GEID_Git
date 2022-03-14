const fs = require('fs');

fs.stat('file.txt', (err, stats) => {
    if(err) {console.log(err);}
    console.log(stats.mtime);
});