module.exports = (sequelize, DataTypes) => sequelize.define(
    'Periodic_jobs',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      details: DataTypes.STRING
    }
  );
  