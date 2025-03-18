const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Annotation = sequelize.define('Annotation', {
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

  return Annotation;
}; 