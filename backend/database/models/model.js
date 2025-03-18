const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

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
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at'
  }
}, {
  tableName: 'models',
  timestamps: false
});

module.exports = Model; 