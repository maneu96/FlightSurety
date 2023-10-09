
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[1];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.owner});
    }
    catch(e) {

    }
    console.log("here")
    let result = await config.flightSuretyData.isAirline.call(newAirline);
    console.log(result)
    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");
    await config.flightSuretyApp.airlineFund({from: newAirline, value: web3.utils.toWei("10")});
    let result2 = await config.flightSuretyData.isAirline.call(newAirline);
    assert.equal(result2, true, "Airline should to register another airline if it has provided funding");
  });
 
  it('(airline is only registered if enough votes are cast', async() =>{
    let newAirline2 = accounts[2];
    let newAirline3 = accounts[3];
    let newAirline4 = accounts[4];
    let newAirline5 = accounts[5];
    let newAirline6 = accounts[6];
    
    await config.flightSuretyApp.registerAirline(newAirline2, {from: config.owner});
    await config.flightSuretyApp.airlineFund({from: newAirline2, value: web3.utils.toWei("10")});
    let result2 = await config.flightSuretyData.isAirline.call(newAirline2);
    assert.equal(result2, true, "Airline should to register another airline if it has provided funding");

    await config.flightSuretyApp.registerAirline(newAirline3, {from: config.owner});
    await config.flightSuretyApp.airlineFund({from: newAirline3, value: web3.utils.toWei("10")});
    let result4 = await config.flightSuretyData.isAirline.call(newAirline3);
    assert.equal(result4, true, "Airline should to register another airline if it has provided funding");
    

    await config.flightSuretyApp.registerAirline(newAirline4, {from: config.owner});
    await config.flightSuretyApp.registerAirline(newAirline4, {from: newAirline2});
    await config.flightSuretyApp.airlineFund({from: newAirline4, value: web3.utils.toWei("10")});
    let result5 = await config.flightSuretyData.isAirline.call(newAirline4);
    assert.equal(result5, true, "Airline should to register another airline if it has provided funding");

    await config.flightSuretyApp.registerAirline(newAirline5, {from: newAirline4});
    await config.flightSuretyApp.registerAirline(newAirline5, {from: newAirline2});
    await config.flightSuretyApp.registerAirline(newAirline5, {from: newAirline3});

    await config.flightSuretyApp.airlineFund({from: newAirline5, value: web3.utils.toWei("10")});
    let result6 = await config.flightSuretyData.isAirline.call(newAirline5);
    assert.equal(result5, true, "Airline should to register another airline if it has provided funding");
});



it('Airline can register a flight', async () =>{
    
    let airline = accounts[0];
   
    let flightKey = await config.flightSuretyApp.getFlightKey.call(airline,"LX-AMS", 12345, {from: airline})
    
    let isRegistered = await config.flightSuretyApp.isFlightRegistered.call(flightKey, {from : airline});
    assert.equal(isRegistered,false, "Error: Flight was already registered")
    let result = await config.flightSuretyApp.registerFlight(flightKey,{from : airline});

    assert.equal(await config.flightSuretyApp.isFlightRegistered.call(flightKey, {from: airline}),true,"Error: Flight is not being registered");
})


it('Passenger can buy insurance', async() =>{
    let airline = accounts[0];
    let passenger = accounts[8]


    let flightKey = await config.flightSuretyApp.getFlightKey.call(airline,"LX-AMS", 12345, {from: airline})
    assert.equal(await config.flightSuretyApp.isInsured.call(passenger,flightKey, {from: passenger}), false, "Passenger is already insured");
    await config.flightSuretyApp.buyInsurance(flightKey,{from: passenger, value: web3.utils.toWei("0.5", "Ether")});
    //await config.flightSuretyData.
    assert.equal(await config.flightSuretyApp.isInsured.call(passenger,flightKey, {from: passenger}), true, "Passenger is not insured");
    

})

it('Passenger can reclaim insurance premium', async() =>{
    let airline = accounts[0];
    let passenger = accounts[8];

    let flightKey = await config.flightSuretyApp.getFlightKey.call(airline,"LX-AMS", 12345, {from: airline})

    //try {
    //    let result = await config.flightSuretyApp.withdrawInsurance.call(flightKey,{from: passenger});
    //} catch (error) {
        await config.flightSuretyApp.processFlightStatus(airline,"LX-AMS", 12345, 20, {from : airline});
     let result = await config.flightSuretyApp.withdrawInsurance.call(flightKey,{from: passenger});
   // }
})
});