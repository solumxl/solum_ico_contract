pragma solidity ^0.4.11;

contract Date {

	struct DateStruct {uint16 year;uint8 month;uint8 day;uint8 hour;uint8 minute;uint8 second;uint8 weekday;}

	uint constant LEAP_YEAR_DURATION = 31622400;

	uint constant YEAR_DURATION = 31536000;

	uint constant DAY_DURATION = 86400;

	uint16 constant START_UNIX_YEAR = 1970;

	function isLeapYear(uint16 year) public pure returns (bool) {
		if (year % 4 != 0) {
			return false;
		}
		if (year % 100 != 0) {
			return true;
		}
		if (year % 400 != 0) {
			return false;
		}
		return true;
	}

	function getYear(uint timestamp) public pure returns (uint16) {
		return uint16(_getYearAndRemainder(timestamp)[0]);
	}

	function getMonth(uint timestamp) public pure returns (uint8) {
		return uint8(_getMonthAndRemainder(timestamp)[0]);
	}

	function getDay(uint timestamp) public pure returns (uint8) {
		timestamp = _getMonthAndRemainder(timestamp)[1];
		return uint8(timestamp / 24 / 60 / 60 + 1);
	}

	function getHours(uint timestamp) public pure returns (uint8) {
		return uint8((timestamp / 60 / 60) % 24);
	}

	function getMinutes(uint timestamp) public pure returns (uint8) {
		return uint8((timestamp / 60) % 60);
	}

	function getSeconds(uint timestamp) public pure returns (uint8) {
		return uint8(timestamp % 60);
	}

	function getWeekday(uint timestamp) public pure returns (uint8) {
		return uint8((timestamp / DAY_DURATION + 4) % 7);
	}

	function getDaysInMonth(uint8 month, uint16 year) public pure returns (uint8) {
		if (month == 4 || month == 6 || month == 9 || month == 11) {
			return 30;
		} else if(month != 2) {
			return 31;
		} else if(isLeapYear(year)) {
			return 29;
		}
		return 28;
	}

	function getYearDuration(uint16 year) public pure returns (uint) {
		return (isLeapYear(year) ? LEAP_YEAR_DURATION : YEAR_DURATION);
	}


	// Internal methods

	function _getYearAndRemainder(uint timestamp) internal pure returns (uint[2]) {
		uint16 year = START_UNIX_YEAR - 1;
		uint _timestamp;
		while (_timestamp < timestamp) {
			year++;
			_timestamp += getYearDuration(year);
		}
		return ([year, getYearDuration(year) - (_timestamp - timestamp)]);
	}

	function _getMonthAndRemainder(uint timestamp) internal pure returns (uint[2]) {
		uint16 year;
		uint[2] memory yearInfo = _getYearAndRemainder(timestamp);
		year = uint16(yearInfo[0]);
		timestamp = yearInfo[1];
		uint8 month = 1;
		uint monthDuration = DAY_DURATION * getDaysInMonth(month, year);

		while(timestamp > monthDuration) {
			timestamp -= monthDuration;
			monthDuration = DAY_DURATION * getDaysInMonth(month, year);
			month++;
		}

		return ([month, timestamp]);
	}
}