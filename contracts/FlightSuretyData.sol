pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./AirlineRole.sol";

contract FlightSuretyData is AirlineRole {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    address private contractApp;
    mapping(address => Insurance []) passengerInsurances;

    struct Insurance {
        bool paid;
        bytes32 flightKey;
        uint256 balance;
    }
    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    //event Sender(address indexed s);

    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                ) 
                                public
                                payable 
    {
        contractOwner = msg.sender;
        
    }

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

    /* 
    * @dev Modifier that requires the "APP" contract to be the function caller
    */
    modifier requireAppContract()
    {
        require(msg.sender == contractApp, "Caller is not the APP contract");
        _;
    } 

    
    

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;
    }

    function isAutorized(address x)
                            public 
                            view
                            returns(bool)
    {
        return contractApp == x;
    }

    function isInsured(address _passenger, bytes32 _flightKey)
                            public
                            view
                            returns(bool)
    {
        Insurance[] memory insurances =  passengerInsurances[_passenger];
        if (insurances.length == 0)
            return false;
        else
            return (insurances[0].flightKey == _flightKey && insurances[0].paid == false && insurances[0].balance > 0  && insurances[0].balance < 1 ether);
    }

   /* function printInsurance() public
    returns (string)
    {
        return
    }
*/
    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus(
                                bool mode
                            ) 
                            external
                            requireContractOwner 
    {
        operational = mode;
    }

    /**
    * @dev Authorises App to be able to call into the data contract
    * can only be called by the contract owner
    */    
    function authorizeCaller(
                                address _app
                            ) 
                            external
                            requireContractOwner
                            returns(address) 
    {
        contractApp = _app;
        return contractApp;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline(   
                                address _newAirline
                            )
                            requireIsOperational()
                            requireAppContract
                            external
    {
        //messageSender = msg.sender;
        //emit Sender(msg.sender);
        addAirline(_newAirline);
       
    }


   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy(   
                    address _passenger,
                    bytes32 _flightKey,
                    uint256 value
                )
                    requireIsOperational()
                    requireAppContract
                    external
                    payable
    {
        require( isInsured(_passenger, _flightKey) == false ,"Passenger is already insured. Can only purchase insurance for 1 flight");
        require(value <= 1 ether, "Maximum Value for the insurance is 1 ETH" );
        //Insurance [] insurances = passengerInsurances[_passenger];
        //require(insurances.length <= 1, "Passenger can only purchase insurance for 1 flight");
        //require(nInsurance < 1, "Passenger can only purchase insurance for 1 flight");
       // for(i=0; i < passengerInsurances[_passenger].length(); i++ )
        //{   
        //    insurance = passengerInsurances
        //    require()
        //}
        Insurance memory newInsurance;
        newInsurance.flightKey = _flightKey;
        newInsurance.balance = value;
        passengerInsurances[_passenger].push(newInsurance);
    }


    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                                address _passenger,
                                bytes32 _flightKey
                            )
                            external
                            payable
                            requireIsOperational()
                            requireAppContract
    {
        require(isInsured(_passenger, _flightKey),"Insurance was already paid / There is no insurance to be paid");
       // require(false,"debug");
       // passengerInsurances[msg.sender].paid = true;
        Insurance [] memory insurance = passengerInsurances[_passenger];
        insurance[0].paid = true;
        //passengerInsurances[msg.sender].balance;
        //passengerInsurances[msg.sender].pop();
        uint256 payout = insurance[0].balance;
        require(payout == 0.5 ether , "No balance");
        uint256 payoutAux = payout.mul(3);
        //address payable to = payable(_passenger);
        require(payoutAux == 1.5 ether , "No balance");
        payout= payoutAux.div(2);
        require(payout == 0.75 ether , "No balance");
        require(address(this).balance > 0, "No balance in the data smart contract");
        bool sent= address(uint160(_passenger)).send(payout);
        require(sent, "Ether not sent");
        
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund
                            (   
                            )
                            public
                            payable
                            requireAppContract()
    {
        
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
                            external 
                            payable
    {
        fund();
    }


}

