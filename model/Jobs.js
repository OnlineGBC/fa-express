module.exports = (sequelize, DataTypes) => sequelize.define(
    'Jobs',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        uid: DataTypes.INTEGER,
        title: DataTypes.STRING(20)
    }
);
