
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;
    
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
            // Write transaction
            console.log(airlineName);
            console.log(airlineAddress);
            console.log(contract.flightSuretyApp.address)
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
        DOM.elid('register-flight').addEventListener('click', () => {
            var flightKey;
            let flightName = DOM.elid('register-flight-name').value;
            console.log(flightName);
            let airlineAddress = DOM.elid('register-flight-airline-address').value;
            console.log(airlineAddress);
            let timeStamp = DOM.elid('register-flight-timestamp').value;
            contract.getFlightKey(airlineAddress,flightName,timeStamp, (error,result)=>{
                flightKey = result;
                console.log(flightKey)
                contract.registerFlight(flightKey, (error,out) => {
                    console.log(error,out)
                    display("display-wrapper-register-flight",'Airlines', 'Flight Registered', [{label: 'Flight Key:', error: error, value: flightKey}]) //"register-flight-name" "register-flight-airline-address" "register-flight-timestamp"
                })
            })
            
        })

        DOM.elid('get-all-flights').addEventListener('click', () => {
            console.log("test")
            contract.getFlights((error,result)=>{
                 console.log(error,result);
                 display("display-wrapper-register-flight",'Flights', 'Registered', [{label: 'Information:', error: error, value: result}]) //"register-flight-name" "register-flight-airline-address" "register-flight-timestamp"
            })
            
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






