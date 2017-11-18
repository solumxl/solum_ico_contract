pragma solidity ^0.4.11;


contract IDate {

	struct DateStruct {uint16 year;uint8 month;uint8 day;uint8 hour;uint8 minute;uint8 second;uint8 weekday;}

	function isLeapYear(uint16 year) public pure returns (bool);

	function getYear(uint timestamp) public pure returns (uint16);

	function getMonth(uint timestamp) public pure returns (uint8);

	function getDay(uint timestamp) public pure returns (uint8);

	function getHours(uint timestamp) public pure returns (uint8);

	function getMinutes(uint timestamp) public pure returns (uint8);

	function getSeconds(uint timestamp) public pure returns (uint8);

	function getWeekday(uint timestamp) public pure returns (uint8);

	function getDaysInMonth(uint8 month, uint16 year) public pure returns (uint8);

	function getYearDuration(uint16 year) public pure returns (uint);

}