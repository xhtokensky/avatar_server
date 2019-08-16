module.exports = {
    modifyUserInfo: {
        nickName: {type: 'string', required: true, allowEmpty: false, min: 1, max: 6} // 昵称
    },
    saveAddressBook: {
        receiptAddress: {type: 'string', required: true, allowEmpty: false},
        walletTypeId: {type: 'int', required: true, allowEmpty: false},
        walletTypeName: {type: 'string', required: true, allowEmpty: false},
        addressName: {type: 'string', required: true, allowEmpty: false}
    },
    delAddressBook:{
        addressId: {type: 'string', required: true, allowEmpty: false}
    },
    checkVersion: {
        version: {type: 'string', required: true, allowEmpty: false}
    },
    realAuth1: {
        name: {type: 'string', required: true, allowEmpty: false},
        identityCard: {type: 'string', required: true, allowEmpty: false}
    },
    realAuth2: {
        identityCardPicture: {type: 'string', required: true, allowEmpty: false},
        identityCardPicture2: {type: 'string', required: true, allowEmpty: false}
    },
    realAuth3: {
        personPicture: {type: 'string', required: true, allowEmpty: false}
    },
    bindBankCard: {
        bankUserName: {type: 'string', required: true, allowEmpty: false},
        bankCardNo: {type: 'string', required: true, allowEmpty: false},
        bankName: {type: 'string', required: true, allowEmpty: false},
        bankBranchName: {type: 'string', required: true, allowEmpty: false},
    },
    bindAlipay: {
        alipayUserName: {type: 'string', required: true, allowEmpty: false},
        alipayAccount: {type: 'string', required: true, allowEmpty: false},
        alipayQrCode: {type: 'string', required: true, allowEmpty: false}
    },
    bindWechat: {
        wechatUserName: {type: 'string', required: true, allowEmpty: false},
        wechatAccount: {type: 'string', required: true, allowEmpty: false},
        wechatQrCode: {type: 'string', required: true, allowEmpty: false}
    },
    setTransactionPassword: {
        phone: {type: 'string', required: true, allowEmpty: false},
        code: {type: 'string', required: true, allowEmpty: false},
        password: {type: 'string', required: true, allowEmpty: false},
    },
    authTransactionPassword: {
        password: {type: 'string', required: true, allowEmpty: false}
    }
};
