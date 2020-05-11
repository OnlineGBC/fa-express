module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "Automation",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      HostName: DataTypes.TEXT,
      LoginID: {
        type: DataTypes.ENUM(
          "rpaauto",
          "raja",
          "funauto",
          "user",
          "rajawinpro64",
          "raja-acer"
        ),
        defaultValue: "rpaauto"
      },
      CMD_PREFIX: {
        type: DataTypes.STRING(30),
        defaultValue: "sudo su -"
      },
      IFN: DataTypes.STRING(15),
      CFN: DataTypes.STRING(15),
      OSType: DataTypes.ENUM(
        "AIX",
        "RHEL_Linux",
        "SuSe_Linux",
        "Windows",
        "Ubuntu_Linux"
      ),
      SID: DataTypes.CHAR(3),
      DBTYPE: DataTypes.ENUM(
        "ora",
        "db2",
        "db6",
        "mss",
        "hdb",
        "syb",
        "sdb",
        "non"
      ),
      AppType: DataTypes.ENUM(
        "StandardABAPJava",
        "APOwLC",
        "BOBJ",
        "CacheServer",
        "ContentServer",
        "ConvergentCharging",
        "none"
      ),
      num1: DataTypes.INTEGER(11),
      num2: DataTypes.INTEGER(11),
      num3: DataTypes.INTEGER(11),
      num4: DataTypes.INTEGER(11),
      num5: DataTypes.INTEGER(11),
      Order_Exec: DataTypes.INTEGER(11),
      CDIR: DataTypes.CHAR(4),
      CUSTNAME: DataTypes.TEXT,
      LOCATION: DataTypes.TEXT,
      HOST_TYPE: DataTypes.ENUM("PRIMARY", "HADR", "DUPLICATE")
    },
    {
      freezeTableName: true,
      getterMethods: {
        loginId() {
          return this.LoginID;
        },
        internalFacingNetworkIp() {
          return this.IFN;
        },
        customerFacingNetwork() {
          return this.CFN;
        },
        osType() {
          return this.OSType;
        },
        hostName() {
          return this.HostName;
        },
        sid() {
          return this.SID;
        },
        custName() {
          return this.CUSTNAME;
        }
      }
    }
  );
