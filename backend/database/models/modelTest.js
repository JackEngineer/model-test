const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ModelTest = sequelize.define('ModelTest', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    testId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'test_id'
    },
    modelId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'model_id'
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

  return ModelTest;
}; 