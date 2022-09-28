'use strict';
const os = require('os');
const command = require('child_process');
const querystring = require('querystring'); 
const fs = require('fs');
const portscanner = require('portscanner');
const readline = require('readline');
const process = require('process');
require('console-error');                                                                                                  
require('console-warn');

const args = querystring.parse(process.argv.filter((arg, index)=> index >= 2 && arg).join('&').toLowerCase());

let PORT = args.port || 3000;                                  

function runScript(srcipt, args, other) {

fs.readFile(__dirname + '/config.json', (error, data) => {
   
   if(error) throw error;
   
   const pathServer = JSON.parse(data).server;
   
   const start = command.spawn(srcipt, [pathServer, ...args], other);

   start.stdout.on('data', (data) => {
      console.log(`${data}`);
   });

   start.stderr.on('data', (data) => {
      console.error(`${data}`);
   });

   start.on('close', (code) => {
      console.log(`bye! ${code}`);
   });
   
});

}

function getIPAdress() {
   
   const ifaces = os.networkInterfaces();
   
   const IPAdress = Object.keys(ifaces).map((ifname, index) => {
     
     let alias = 0;
   
     const address = ifaces[ifname].filter( iface => {
     
       if ('IPv4' !== iface.family || iface.internal !== false) return;
       
       if (alias >= 1) return iface.address;
       
       else return iface.address;
       
       ++alias;
       
     });
  
    return address.length && address
  
}).filter(e=>e)[0];
  return IPAdress ? IPAdress[0].address.trim() : 'localhost';

}

function checkPORT(host, PORT, callbackFunction) {
   
   
   const ip = '127.0.0.1';
   
   portscanner.checkPortStatus(parseInt(PORT), ip, (error, status) => {
 
   if(error) throw error;
  
   if(status !== 'open') {
     
     if(typeof callbackFunction === 'function') 
         
         callbackFunction(null, host, PORT);
  
   } else { 
     
     const error = new Error(PORT + ' is busy');
     
     if(typeof callbackFunction === 'function')
     
      callbackFunction(error,host, PORT);
    
   }
  
   })
   
}

function question(text='how goes it ?', callbackFunction=null, read=null, PORT, host) {
   
   if(read) read.close();
   
   const reader = readline.createInterface({ 
      input: process.stdin,
      output: process.stdout
   });
   reader.question('\x1b[36m'+text+' (Y/n):\t\x1b[0m', (answer) => {    
         answer = answer.toLowerCase()
         reader.close();
         
      if(answer === 'y' || answer === 'yes' || answer === 'n' || answer === 'no') {
         if((answer === 'y' || answer === 'yes') && typeof callbackFunction === 'function')             
            callbackFunction(null, host, PORT);
         else console.error('operation starting server aborted;', (new Date()).toLocaleString('en-Us'))
         }
      else question(text, callbackFunction, reader, PORT);
   })
}

function turnProcess(error, host, PORT) {
   
   if(error) starting(error, host, PORT);
   else {
      runScript(
      'node',
     [],
      { env: {...process.env, host: host, PORT: PORT} }
      );
   }
   
}

function starting(error, host, PORT) {
   
   if(error) {
      console.error(error);
      question('do yo want to turns server on PORT ' + (PORT+1), starting, null, parseInt(PORT) +1, host );
   } else {
      checkPORT(host, PORT, turnProcess);
   }
   
}


fs.readFile(__dirname + '/config.json', (error, data) => {
   
   //let config = {};
   if(error) throw error;
   const config = {
     ...JSON.parse(data),
     ...args,
  }
  //console.log(config.port || PORT)

   
   starting(null, config.host || getIPAdress(), config.port || PORT);
})
