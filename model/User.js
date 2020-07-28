module.exports = (sequelize, DataTypes) => sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      email: DataTypes.STRING(50),
      password: DataTypes.STRING.BINARY
    }
  );
  