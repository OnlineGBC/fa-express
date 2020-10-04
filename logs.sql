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
