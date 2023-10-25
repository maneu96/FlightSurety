import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';
import WebSocketProvider from 'web3-providers-ws';

let config = Config['localhost'];
//var WebSocketProvider= require('web3-providers-ws');
let link = config.url.replace('http', 'ws')
link = 'ws://127.0.0.1:8545'
console.log(link);
let web3 = new Web3(new Web3.providers.WebsocketProvider(link));
console.log("Connected to Web3 Socket")
//let web3 =  new Web3(link);

//let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp =  new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

const ORACLES_COUNT = 20;

const STATUS_CODE_UNKNOWN = 0;
const STATUS_CODE_ON_TIME = 10;
const STATUS_CODE_LATE_AIRLINE = 20;
const STATUS_CODE_LATE_WEATHER = 30;
const STATUS_CODE_LATE_TECHNICAL = 40;
const STATUS_CODE_LATE_OTHER = 50;

const REGISTRATION_FEE = web3.utils.toWei("1", 'ether');

let statusCodes = [STATUS_CODE_UNKNOWN, 
  STATUS_CODE_ON_TIME, 
  STATUS_CODE_LATE_AIRLINE, 
  STATUS_CODE_LATE_WEATHER, 
  STATUS_CODE_LATE_TECHNICAL,
  STATUS_CODE_LATE_OTHER]
//let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
let oracles = [];
//await flightSuretyData.methods.authorizeCaller(config.appAddress);
async function setup(){
  // ARRANGE
  let fee = REGISTRATION_FEE;
  let accounts = await web3.eth.getAccounts();
  console.log(accounts);
  var block = await web3.eth.getBlock("latest");


 
  // ACT
  for(let a=0; a< ORACLES_COUNT; a++) {      
    await flightSuretyApp.methods.registerOracle().send({ from: accounts[a], value: fee, gas: block.gasLimit});
    let result = await flightSuretyApp.methods.getMyIndexes().call({from: accounts[a]});
    oracles.push(result);
    console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
    console.log(a);
  }
 // let initialFlight = web3.utils.soliditySha3(accounts[0],"LX-AMS -> 12h00");
 // await flightSuretyApp.methods.registerFlight(initialFlight).send({from: accounts[0], gas: block.gasLimit});
 // let timestamp= Math.floor(Date.now() / 1000);
 // await flightSuretyApp.methods.fetchFlightStatus(accounts[0],initialFlight,timestamp).send({from:accounts[0], gas:block.gasLimit});
}

setup();

flightSuretyApp.events.OracleRequest({fromBlock: 0}, 
async function (error, event) {
    if (error){
      console.log(error)
    }
    else{ 
    console.log(event)
    let accounts = await web3.eth.getAccounts();
    let airline = event.returnValues.airline; 
    //console.log(airline)
    let flight = event.returnValues.flight;
    let timestamp = event.returnValues.timestamp; 
    let index = event.returnValues.index
    let statusCode = '20'; //Always trigger delayed status
    //console.log({airline,flight, timestamp,index})
    let block = await web3.eth.getBlock('latest');
    //let validIndices = oracles[index];
   // console.log(validIndices);
    let responses = 0;
    for(let i=0; i< oracles.length; ++i){
      const oracleIndices = oracles[i];
      console.log(oracleIndices);
      console.log(accounts[i])
      if (oracleIndices.includes(index))
      {
        await flightSuretyApp.methods.submitOracleResponse(index,airline,flight,timestamp,statusCode).send({from: accounts[i], gas:  block.gasLimit});
        ++responses;
        if (responses==3)
          break;
      }
    } 

    console.log("Is Flight Delayed?: " + await flightSuretyApp.methods.isFlightDelayed( web3.utils.soliditySha3(accounts[0],"LX-AMS -> 12h00")).call());
    }
})

flightSuretyApp.events.FlightStatusInfo({fromBlock: 0}, 
  async function (error, event) {
    if (error){
      console.log(error)
    }
    else{ 
      //console.log(event);
    }

  })
const app = express();
//app.get('/api', (req, res) => {
//    res.send({
//      message: 'An API for use with your Dapp!'
//    })
//})

export default app;


