
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {
    let debug = null
    let result = null;
    let Flights = [];

    let contract = new Contract('localhost', () => {
       /* before('setup contract', async () => {
            await contract.authorization();
          });*/
        // Read transaction
        
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('display-wrapper','Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });
    

        // User-submitted transaction
        DOM.elid('submit-airline').addEventListener('click', async () => {
            let airlineName = DOM.elid('airline-name').value;
            let airlineAddress = DOM.elid('airline-address').value;
            await contract.getAccount();
            contract.registerAirline(airlineAddress,(error,result) =>{//airlineName,airlineAddress,(error,result) =>{
                display("display-wrapper-register",'Airlines','Registration',[{ label: 'Airline candidate registration Tx', error: error, value: result }]);
            })
            // contract.fetchFlightStatus(flight, (error, result) => {
           //     display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
           // });
        })

        DOM.elid('vote-airline').addEventListener('click', async () => {
            let airlineAddress = DOM.elid('airline-address').value;
            // Write transaction
            await contract.getAccount();
            contract.registerAirline(airlineAddress,(error,result) =>{//airlineName,airlineAddress,(error,result) =>{
                display("display-wrapper-register",'Airlines','Registration',[{ label: 'Airline candidate registration Tx', error: error, value: result }]);
            })
            // contract.fetchFlightStatus(flight, (error, result) => {
           //     display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
           // });
        })

        DOM.elid('fund-airline').addEventListener('click', async () => {
            let airlineName = DOM.elid('airline-name').value;
            let airlineAddress = DOM.elid('airline-address').value;
            // Write transaction
            await contract.getAccount();
            contract.airlineFund((error,result) =>{//airlineName,airlineAddress,(error,result) =>{
                display("display-wrapper-register",'Airlines','Registration',[{ label: 'Airline fund Tx', error: error, value: result }]);
            })
            console.log(await contract.flightSuretyData.methods.caller().call({from: contract.owner}))
            // contract.fetchFlightStatus(flight, (error, result) => {
           //     display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
           // });
        })


        DOM.elid('is-registered').addEventListener('click', () => {
            let airlineName = DOM.elid('airline-name').value;
            let airlineAddress = DOM.elid('airline-address').value;
            // Write transaction
            console.log(airlineName);
            console.log(airlineAddress);
            contract.getAccount();
            contract.isAirline(airlineAddress,(error,result) =>{//airlineName,airlineAddress,(error,result) =>{
                console.log(error,result);
            })
            contract.isAirline(airlineAddress,(error,result) =>{//airlineName,airlineAddress,(error,result) =>{
                display("display-wrapper-register",'Airlines','Registration',[{ label: 'Is Airline', error: error, value: result }]);
            })
            // contract.fetchFlightStatus(flight, (error, result) => {
           //     display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
           // });
        })
        //Airline Flight Submission
        DOM.elid('register-flight').addEventListener('click', async () => {
            let flightName = DOM.elid('register-flight-name').value;
            flightName = flightName + " @ " + DOM.elid('register-flight-timestamp').value
            let airlineAddress = DOM.elid('register-flight-airline-address').value;
            console.log(airlineAddress);
            let timeStamp = Math.floor(Date.now() / 1000);
            let flightKey;
            await contract.getAccount();
            contract.getFlightKey(airlineAddress,flightName,timeStamp, async (error,result)=>{
                flightKey = result;
                console.log(flightKey);
                let out = await contract.registerFlight(flightKey);
                Flights.push({address : airlineAddress, name : flightName, time: timeStamp, key: flightKey});
                console.log(out);
                display("display-wrapper-register-flight",'Airlines', 'Flight Registered', [{label: 'Flight Key:', error: error, value: flightKey}])
                console.log("Is flight registered?")
                console.log(await contract.isFlightRegistered(flightKey))
                    
                    //"register-flight-name" "register-flight-airline-address" "register-flight-timestamp"
    
                
            })
            
        })

        DOM.elid('get-all-flights').addEventListener('click', async () => {
            console.log(await contract.getFlights());
            displayFlights("display-wrapper-register-flight",Flights) //"register-flight-name" "register-flight-airline-address" "register-flight-timestamp"
            //console.log(Flights[0].key)//.flightKey[0]);
            //console.log(await contract.isFlightRegistered(Flights[0].key))
            /*contract.getFlights((error,out) => {
                console.log(error,out)
                //display("display-wrapper-register-flight",'Airlines', 'Flight Registered', [{label: 'Flight Key:', error: error, value: flightKey}]) //"register-flight-name" "register-flight-airline-address" "register-flight-timestamp"
            })*/
        })



        DOM.elid('submit-buy').addEventListener('click', async () => {
            let flightKey = DOM.elid('insurance-flight-key').value;
            let value = contract.web3.utils.toWei(DOM.elid('insurance-ammount').value);
            console.log(value);
            // Write transaction
            await contract.getAccount();
            console.log(await contract.isFlightRegistered(flightKey));
            contract.buyInsurance(flightKey, value,(error,result) =>{//airlineName,airlineAddress,(error,result) =>{
                console.log(error,result)
                display("display-wrapper-buy",'Passenger','Insurance Bought',[{ label: ' Tx', error: error, value: result }]);
            })
        })


        DOM.elid('is-insured').addEventListener('click', async () => {
            let flightKey = DOM.elid('insurance-flight-key').value;
            // Write transaction
            await contract.getAccount();
            let result = await contract.isInsured(flightKey);
            console.log(result);
            display("display-wrapper-buy",'Passenger','Is insured?',[{ label: ':', value: result }]);
        })

        DOM.elid('check-balance').addEventListener('click', async () => { //0xe649a4c80e0626a73ee96911842b9c4facd50f54ac47888fc3c66e07e85d5cc7
            await contract.getAccount();
            let flightKey = DOM.elid('withdraw-flight-key').value;
            console.log(flightKey);
            let result = await contract.ammountToPay(flightKey);
            console.log(result);
            console.log(contract.owner);
            await contract.processFlightStatus(contract.owner,flightKey,1234,20);
            result = await contract.ammountToPay(flightKey);
            console.log(result);
            display("display-wrapper-passenger-detail",'Passenger','Value Available to Withdraw',[{ label: ':', value: result }]);
        })

        DOM.elid('withdraw-balance').addEventListener('click', async () => {
            let flightKey = DOM.elid('withdraw-flight-key').value;
            // Write transaction
            await contract.getAccount();
            console.log("withdraw");
            result = await contract.withdrawInsurance(flightKey);
            console.log(result);
            display("display-wrapper-passenger-detail",'Passenger','Value withdraw',[{ label: 'Tx', value: result.transactionHash }]);
        
        })



        DOM.elid('submit-oracle').addEventListener('click',  () => {
            let flightKey = DOM.elid('insurance-flight-key').value;
            // Write transaction
            //await contract.getAccount();
            result =  contract.fetchFlightStatus(flightKey);
            console.log("Oracles")
            console.log(result);
            display("display-wrapper-passenger-detail",'Passenger','Value withdraw',[{ label: 'Tx', value: result.transactionHash }]);
        
        })
    
    });
    

})();


function display(displayWrapper,title, description, results) {
    let displayDiv = DOM.elid(displayWrapper);
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}

function displayFlights(displayWrapper, Flights){
    let displayDiv = DOM.elid(displayWrapper);
    let section = DOM.section();
    section.appendChild(DOM.h2("Available Flights"));
    //section.appendChild(DOM.h5("Airline Address - Name - Time"));
    Flights.map((Flights) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, "Flight Information"));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, String(Flights.name)));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, "Last update Timestamp"));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, String(Flights.time)));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, "Flight Key"));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, String(Flights.key)));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, "Airline Address"));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, String(Flights.address)));// + "Flight: " + String(Flights.name) + "Departure Time: " + String(Flights.time)));
        row.appendChild(DOM.p({className: 'col-sm-4 field'}, " "));
        section.appendChild(row);
    })
    displayDiv.append(section);

    
}





