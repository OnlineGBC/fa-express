module.exports = (sequelize, DataTypes) => sequelize.define(
  'Logs',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uid: DataTypes.INTEGER(11),
    ref_num: DataTypes.INTEGER(11),
    CFN: DataTypes.STRING(16),
    IFN: DataTypes.STRING(16),
    SID: DataTypes.STRING(16),
    content: DataTypes.BLOB('long'),
    DateGenerated: DataTypes.STRING,
    TimeGenerated: DataTypes.STRING(128),
    TZ: DataTypes.STRING,
    DateScheduled: DataTypes.STRING,
    TimeScheduled: DataTypes.STRING,
    periodic: DataTypes.INTEGER(1),
    HostName: DataTypes.TEXT,
    ErroCode: DataTypes.INTEGER(11),
    CustName: DataTypes.TEXT,
    ScriptName: DataTypes.TEXT,
    Status: DataTypes.STRING(20)
  },
  {
    indexes: [
      {
        name: 'CFN-IFN-SID',
        unique: false,
        fields: ['CFN', 'IFN', 'SID'],
      },
    ],
  },
);
