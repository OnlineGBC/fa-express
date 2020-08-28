-- phpMyAdmin SQL Dump
-- version 4.9.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Aug 28, 2020 at 11:01 PM
-- Server version: 5.7.14
-- PHP Version: 7.0.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `fa_rpa`
--

-- --------------------------------------------------------

--
-- Table structure for table `logs`
--

DROP TABLE IF EXISTS `Logs`;
CREATE TABLE IF NOT EXISTS `Logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uid` int(11) DEFAULT NULL,
  `ref_num` int(10) DEFAULT NULL,
  `CFN` varchar(16) DEFAULT NULL,
  `IFN` varchar(16) DEFAULT NULL,
  `SID` varchar(16) DEFAULT NULL,
  `content` longblob,
  `DateGenerated` varchar(255) DEFAULT NULL,
  `TimeGenerated` varchar(128) DEFAULT NULL,
  `TZ` varchar(255) DEFAULT NULL,
  `DateScheduled` varchar(255) DEFAULT NULL,
  `TimeScheduled` varchar(255) DEFAULT NULL,
  `HostName` text,
  `ErroCode` int(11) DEFAULT NULL,
  `CustName` text,
  `ScriptName` text,
  `Status` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `CFN-IFN-SID` (`CFN`,`IFN`,`SID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
