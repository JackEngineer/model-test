const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');
const Test = require('./test');

const Annotation = sequelize.define('Annotation', {
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
  data: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      const rawValue = this.getDataValue('data');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      this.setDataValue('data', JSON.stringify(value));
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at'
  }
}, {
  tableName: 'annotations',
  timestamps: false
});

// 定义关联关系
Annotation.belongsTo(Test, { foreignKey: 'testId', as: 'test' });
Test.hasMany(Annotation, { foreignKey: 'testId', as: 'annotations' });

module.exports = Annotation; 