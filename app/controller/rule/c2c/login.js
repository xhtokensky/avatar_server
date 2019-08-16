module.exports = {
    getsmscode: {
        type: {type: 'string', required: true, allowEmpty: false},
        phoneNumber: {type: 'string', required: true, allowEmpty: false},
        duid:  {type: 'string', required: true, allowEmpty: false},
        pcode: {type: 'string', required: true, allowEmpty: false}
    },
    usersendsms: {
        phone:  {type: 'string', required: true, allowEmpty: false},
        code: {type: 'string', required: true, allowEmpty: false}
    },
    smslogin: {
        phone:  {type: 'string', required: true, allowEmpty: false},
        code: {type: 'string', required: true, allowEmpty: false}
    },
    upnickname:{
        nickName:  {type: 'string', required: true, allowEmpty: false},
    },
    checkverify: {
        duid:  {type: 'string', required: true, allowEmpty: false},
        type: {type: 'string', required: true, allowEmpty: false},
    },
    resetpasswrod: {
        phone:  {type: 'string', required: true, allowEmpty: false},
        code: {type: 'string', required: true, allowEmpty: false},
        password: {type:  'string',required: true,allowEmpty: false},
    },
}
