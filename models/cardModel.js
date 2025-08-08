const {DataTypes} = require('sequelize');
const {sequelize} = require('./../config/db');
const { text } = require('express');

const card = sequelize.define('invitations', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        field: 'id'
    },
    name: DataTypes.STRING(255),
    phone_number: DataTypes.STRING(255),
    status: DataTypes.INTEGER,
    scanned: DataTypes.INTEGER,
    card_uid: DataTypes.TEXT,
    card: DataTypes.TEXT,
    created_at: DataTypes.DATEONLY,
    updated_at: DataTypes.DATEONLY
}, {
    timestamps: false,
    tableName: 'invitations'
});

module.exports = card;
