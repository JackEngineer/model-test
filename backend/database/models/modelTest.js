const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');
const Test = require('./test');
const Model = require('./model');

const ModelTest = sequelize.define('ModelTest', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  testId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'test_id',
    references: {
      model: Test,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  modelId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'model_id',
    references: {
      model: Model,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  result: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('result');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      this.setDataValue('result', value ? JSON.stringify(value) : null);
    }
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'completed', 'failed']]
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at'
  }
}, {
  tableName: 'model_tests',
  timestamps: false
});

// 定义关联关系
ModelTest.belongsTo(Test, { foreignKey: 'testId', as: 'test' });
ModelTest.belongsTo(Model, { foreignKey: 'modelId', as: 'model' });
Test.hasMany(ModelTest, { foreignKey: 'testId', as: 'modelTests' });
Model.hasMany(ModelTest, { foreignKey: 'modelId', as: 'tests' });

module.exports = ModelTest; 