const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ApiConfig = sequelize.define('ApiConfig', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    models: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    defaultModelId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    tableName: 'api_configs',
    timestamps: true
  });

  return ApiConfig;
}; 