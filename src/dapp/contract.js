import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.initialize(callback);
        this.owner = null;
        this.Account = null;
        this.airlines = [];
        this.passengers = [];
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];

            let counter = 1;
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }
            callback();
        });
        
    }
    async authorization(){
        let self = this;
        self.flightSuretyData.methods.authorizeCaller(self.flightSuretyApp._address).call(self.owner,(error,result) =>{
        });
    }

    async getAccount() {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
          .catch((err) => {
            if (err.code === 4001) {
              // EIP-1193 userRejectedRequest error
              // If this happens, the user rejected the connection request.
              console.log('Please connect to MetaMask.');
            } else {
              console.error(err);
            }
          });
        this.Account = accounts[0];
    }
    

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }

    registerAirline(newAirline,callback){
        let self = this;
        self.flightSuretyApp.methods.registerAirline(newAirline).send({from: self.Account},  (error, result) => {
            callback(error, result);
        });
    }
    
    isAirline(airline,callback){
        let self = this;
        self.flightSuretyApp.methods.isAirline(airline).call({from: self.Account},callback);
    
    }

    airlineFund(callback){
        let self = this;
        console.log("WTF IS GOING ON CRL")
        console.log(self.Account);
        console.log("Authorized?")
        self.flightSuretyData.methods.authorizeCaller(self.flightSuretyApp._address).call({from: self.owner},(error,result)=>{
            console.log(result);
        });
        self.flightSuretyData.methods.isAutorized(self.flightSuretyApp._address).call({from: self.owner},(error,result) =>{
            console.log(result);
        })
        self.flightSuretyApp.methods.isAutorized(self.flightSuretyApp._address).call((error,result) =>{
            console.log(result);
        })
        self.flightSuretyApp.methods.airlineFund().send({from: self.Account, value: self.web3.utils.toWei("10")}, (error,result) =>{
            callback(error,result);
        });

    }
    getFlightKey(airlineAddress,flightName,timeStamp,callback){
        let self= this;
        console.log(self.flightSuretyApp.methods);
        self.flightSuretyApp.methods.getFlightKey(airlineAddress,flightName,timeStamp).call((error,result) =>{
            callback(error,result);
        });
    }
    registerFlight(flightKey,callback){
        let self = this;
        self.flightSuretyApp.methods.registerFlight(flightKey).call( {from: self.Account}, (error,result)=>{
            callback(error,result);
        });
    }

    getFlights(callback){
        let self = this;
        console.log("here")
        console.log(self.flightSuretyApp.methods);
        self.flightSuretyApp.methods.getFlights.call((error,result)=>{
            console.log(error,result);
            callback(error,result);
        });
    }
    
}