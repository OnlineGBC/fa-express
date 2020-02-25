"use strict";
module.exports = (sequelize, DataTypes) => {
  var Logs = sequelize.define(
    "Logs",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      CFN: DataTypes.STRING(16),
      IFN: DataTypes.STRING(16),
      SID: DataTypes.STRING(16),
      content: DataTypes.BLOB,
      DateGenerated: DataTypes.STRING,
      TimeGenerated: DataTypes.STRING(128),
      TZ: DataTypes.STRING,
      DateScheduled: DataTypes.STRING,
      TimeScheduled: DataTypes.STRING,
      HostName: DataTypes.TEXT,
      ErroCode: DataTypes.INTEGER(11),
      CustName: DataTypes.TEXT
    },
    {
      indexes: [
        {
          name: "CFN-IFN-SID",
          unique: false,
          fields: ["CFN", "IFN", "SID"]
        }
      ]
    }
  );

  return Logs;
};
