module.exports = {
    getChongbiAddress: {
        coinType: {type: 'string', required: true, allowEmpty: false}
    },
    tibi: {
        coinType: {type: 'string', required: true, allowEmpty: false},
        address: {type: 'string', required: true, allowEmpty: false},
        quantity: {type: 'number', required: true, allowEmpty: false},
        transactionPassword: {type: 'string', required: true, allowEmpty: false}
    },
    getMaxBalance: {
        coinType: {type: 'string', required: true, allowEmpty: false}
    },
    updateHeadimg: {
        headimg: {type: 'string', required: true, allowEmpty: false}
    },
    userRegistrationId: {
        registrationId: {type: 'string', required: true, allowEmpty: false}
    }
};
