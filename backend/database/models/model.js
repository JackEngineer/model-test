const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Model = sequelize.define('Model', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    apiEndpoint: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'api_endpoint'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at'
    }
  }, {
    tableName: 'models',
    timestamps: false
  });

  return Model;
}; 