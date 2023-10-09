const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');

module.exports = function(deployer) {

    let firstAirline = '0x27D8D15CbC94527cAdf5eC14B69519aE23288B95' //'0xf17f52151EbEF6C7334FAD080c5704D77216b732';
    deployer.deploy(FlightSuretyData, {from: firstAirline, value: web3.utils.toWei("10")})
    .then( () => { 
        return deployer.deploy(FlightSuretyApp, FlightSuretyData.address)
        .then( deployer => { 
            return FlightSuretyData.deployed();
        }).then(dataContractInstance =>{
            return dataContractInstance.authorizeCaller(FlightSuretyApp.address);
        }).then(result => {
            let config = {
                localhost: {
                    url: 'http://localhost:8545',
                    dataAddress: FlightSuretyData.address,
                    appAddress: FlightSuretyApp.address
                }
            }
            fs.writeFileSync(__dirname + '/../src/dapp/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
            fs.writeFileSync(__dirname + '/../src/server/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
        }).catch(err =>{
            console.log(err);
        });
                   
                   
    });
    
    /*let accounts = web3.eth.getAccounts();
    let flightSuretyData = await FlightSuretyData.new();
    console.log("AUTHORIZED ADDRESS")
    console.log(FlightSuretyApp.address);
    await flightSuretyData.authorizeCaller(FlightSuretyApp.address,{from: firstAirline});
    console.log("AUTORIZED")
    console.log(await flightSuretyData.isAutorized(FlightSuretyApp.address));*/
}
