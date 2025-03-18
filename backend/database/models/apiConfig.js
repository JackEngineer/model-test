const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const ApiConfig = sequelize.define('ApiConfig', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  accessKeyId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'access_key_id'
  },
  accessKeySecret: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'access_key_secret'
  },
  endpoint: {
    type: DataTypes.STRING,
    allowNull: false
  },
  modelId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'model_id'
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_default'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at'
  }
}, {
  tableName: 'api_configs',
  timestamps: false
});

module.exports = ApiConfig; 