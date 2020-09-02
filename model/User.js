module.exports = (sequelize, DataTypes) => sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      fname: DataTypes.STRING(20),
      lname: DataTypes.STRING(20),
      email: DataTypes.STRING(50),
      password: DataTypes.STRING.BINARY,
      otp_key: DataTypes.STRING(35),
      admin: DataTypes.INTEGER
    }
  );
  