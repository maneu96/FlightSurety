pragma solidity ^0.4.25;
pragma experimental ABIEncoderV2;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./FlightSuretyData.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)
    FlightSuretyData private data;
    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;
    

    address private contractOwner;          // Account used to deploy contract
    bool private operational = true; 
    uint nrAirlines;
    uint nFlights;
    uint private N = 1; //Number of required signatures (Multiparty Consensus)

    bytes32 [] public flightKeys;
    struct Flight {
        bytes32 flightKey;
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;        
        address airline;
    }
    mapping(bytes32 => Flight) public flights;

    struct AirlineCandidate{
        bool funded;
        address [] whoVoted;
    }
    mapping (address => AirlineCandidate) private airlineQueue;
    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
         // Modify to call data contract's status
        require(operational, "Contract is currently not operational");  
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }
    modifier requireAirline()
    {
        require(data.isAirline(msg.sender), "Caller does not have airline privileges");
        _;
    }

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    constructor
                                (
                                address _dataContractAddress
                                ) 
                                public 
    {
        contractOwner = msg.sender;
        data = FlightSuretyData(_dataContractAddress);
        nrAirlines = 1;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;  // Modify to call data contract's status
    }
    function isAirline(address airline)
                        public
                        view
                        returns(bool)
    {
        return data.isAirline(airline);
    }

    function isAutorized(address appContract)
                          external
                          view
                          returns(bool)
    {
        return data.isAutorized(appContract);
    }

    function isFlightRegistered(bytes32 _flightKey) public view returns(bool)
    {
        return flights[_flightKey].isRegistered;
    }
    function isFlightDelayed(bytes32 _flightKey) public view returns(bool){
        return flights[_flightKey].statusCode == STATUS_CODE_LATE_AIRLINE;
    }

    function isInsured(address _passenger, bytes32 _flightKey)
    public
    view
    returns(bool)
    {
        return data.isInsured(_passenger, _flightKey);
    }



    function getFlights() public view
    returns (Flight [] memory)
    {
        Flight[] memory flightArray = new Flight[](flightKeys.length); 
        for (uint i =0; i< flightKeys.length; ++i)
        {
            flightArray[i] = flights[flightKeys[i]];
        }
        
        return flightArray;
    }


    function ammountToPay(address _passenger, bytes32 flightKey) external view
    returns(uint256){
       
        uint ammount = data.ammountToPay(_passenger, flights[flightKey].statusCode == STATUS_CODE_LATE_AIRLINE);
        return ammount;
    }
    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

  
   /**
    * @dev Add an airline to the registration queue
    *
    */   
    function registerAirline
                            (  
                                address _newAirline 
                            )
                            external
                            requireIsOperational()
                            requireAirline()
                            returns(bool success, uint votes)
    {
        votes = airlineQueue[_newAirline].whoVoted.length;
        if (votes >= N)
        {
            return(true,0);
        }
        for(uint i = 0; i < votes; i++)
        {
            require(msg.sender != airlineQueue[_newAirline].whoVoted[i], "This airline has already voted");
        }
        airlineQueue[_newAirline].whoVoted.push(msg.sender);
        return (success, ++votes);
        
    }

    function airlineFund
                        (
                        )
                        external
                        payable
                        requireIsOperational()
                        returns(bool)
    {
        require(!data.isAirline(msg.sender), "Airline is already registered");
        require ((airlineQueue[msg.sender].whoVoted).length >= N, "This account does not have the necessary ammount of votes");
        require (msg.value == 10 ether, "Airlines need to fund the contract with a minumum of 10 ETH") ;
        data.send(msg.value);
        data.registerAirline(msg.sender);
        ++ nrAirlines;
        if(nrAirlines >= 4)
        {
            N = nrAirlines/2;
        }
        return true;
    }
   /**
    * @dev Register a future flight for insuring.
    *
    */  
    function registerFlight
                                (
                                    bytes32 flight
                                )
                                public
                                requireIsOperational()
                                requireAirline()
                                returns (bool, bytes32)
    {
        require(flights[flight].isRegistered== false, "Flight is already registered");
    //    Flight storage newFlight;
        flights[flight].isRegistered = true;
        flights[flight].statusCode = STATUS_CODE_ON_TIME; //default value
        flights[flight].updatedTimestamp = now;//uint256 updatedTimestamp = ;        
        flights[flight].airline = msg.sender;
        flights[flight].flightKey = flight;
        //flights[flight] = newFlight;
        flightKeys.push(flight);
        return (isFlightRegistered(flight), flight);

    }
    
   /**
    * @dev Called after oracle has updated flight status
    *
    */  
    function processFlightStatus
                                (
                                    address airline,
                                    bytes32 flightKey,
                                    uint256 timestamp,
                                    uint8 statusCode
                                )
                                
                                public
                                view
                                requireIsOperational()
    {
        //bytes32 flightKey = keccak256(abi.encodePacked(airline,flight));
        flights[flightKey].statusCode = statusCode;
        flights[flightKey].updatedTimestamp = timestamp;
    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus
                        (
                            address airline,
                            bytes32 flight,
                            uint256 timestamp                            
                        )
                        external
                        requireIsOperational()
    {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key] = ResponseInfo({
                                                requester: msg.sender,
                                                isOpen: true
                                            });

        emit OracleRequest(index, airline, flight, timestamp);
    } 

    function buyInsurance (
                            bytes32 _flightKey
    )
                            public
                            payable
                            requireIsOperational()
    {
        require(! data.isAirline(msg.sender), "Airlines cannot purchase insurances");
        require(isFlightRegistered(_flightKey), "Flight is not registered");
        require(flights[_flightKey].statusCode == STATUS_CODE_ON_TIME, "Flight is not up for Insuring");
        require(data.send(msg.value), "Value not sent to the data contract");
        data.buy(msg.sender, _flightKey, msg.value);
    }

    function withdrawInsurance(
                            bytes32 _flightKey

    )
                            public
                            requireIsOperational()
    {
        require(flights[_flightKey].statusCode == STATUS_CODE_LATE_AIRLINE, "Passenger does not have a right to be refunded");
        data.pay(msg.sender,_flightKey);
    }
// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;    

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;        
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, bytes32 flight, uint256 timestamp, uint8 status, bytes32 flightKey);

    event OracleReport(address airline, bytes32 flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, bytes32 flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle
                            (
                            )
                            external
                            payable
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
    }

    function getMyIndexes
                            (
                            )
                            view
                            external
                            returns(uint8[3])
    {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }




    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
                        (
                            uint8 index,
                            address airline,
                            bytes32 flight,
                            uint256 timestamp,
                            uint8 statusCode
                        )
                        external
    {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp)); 
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {
               
                // Handle flight status as appropriate
            bytes32 flightKey = keccak256(abi.encodePacked(airline, flight)); 
            emit FlightStatusInfo(airline, flight, timestamp, statusCode, flightKey);
            
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }


    function getFlightKey
                        (
                            address airline,
                            string flight,
                            uint256 timestamp
                        )
                        public
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
                            (                       
                                address account         
                            )
                            internal
                            returns(uint8[3])
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);
        
        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
                            (
                                address account
                            )
                            internal
                            returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion

}   

//contract FlightSuretyData {
 //   function 
//}