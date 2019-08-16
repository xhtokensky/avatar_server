module.exports = app => {
    const {router, controller} = app;

    const isAuthenticated = app.middleware.isAuthenticated();
    const isSetPwd = app.middleware.isSetPassword();

    router.get("/avatar/c2c/Logout", isAuthenticated, controller.c2c.login.loginOut); // 用户退出登录
    router.post("/avatar/c2c/GetSmsCode", controller.c2c.login.getSmsCode); // 用户发起短信认证服务 [0: 注册, 1: 登录, 2: 设置交易密码
    router.get("/avatar/c2c/UserSendSms/:phone/:code", controller.c2c.login.UserSendSms); // 用户提交认证服务
    router.post("/avatar/c2c/SmsLogin", controller.c2c.login.SmsLogin); // 用户提交认证服务
    router.get("/avatar/c2c/verify/:duid/:type", controller.c2c.login.verify);//获取验证码
    router.get("/avatar/c2c/getUserInfo", isAuthenticated, controller.c2c.user.getUserInfo); // 获取用户信息
    router.post('/avatar/c2c/modifyUserInfo', isAuthenticated, controller.c2c.user.modifyUserInfo);//修改用户信息
    router.post('/avatar/c2c/saveAddressBook', isAuthenticated, controller.c2c.user.saveAddressBook);//新增地址簿
    router.get('/avatar/c2c/getAddressBook', isAuthenticated, controller.c2c.user.getAddressBook);//获取地址簿
    router.post('/avatar/c2c/delAddressBook', isAuthenticated, controller.c2c.user.delAddressBook);//删除地址簿
    router.post('/avatar/c2c/uploadFile', controller.c2c.multiple.upload);//图片上传
    router.post('/avatar/c2c/batchUploadFile', isAuthenticated, controller.c2c.multiple.batchUploadFile);//批量上传
    router.post('/avatar/c2c/realAuth/:step', isAuthenticated, controller.c2c.user.realAuth);//实名认证
    router.get('/avatar/c2c/goAuth', isAuthenticated, controller.c2c.user.goAuth);//实名认证验证
    router.post("/avatar/c2c/setTransactionPassword", isAuthenticated, controller.c2c.user.setTransactionPassword); // 设置交易密码
    router.post('/avatar/c2c/bindBankCard', isAuthenticated, isSetPwd, controller.c2c.user.bindBankCard);//绑定银行卡
    router.get('/avatar/c2c/bindBankCard', isAuthenticated, controller.c2c.user.getBindBankCard);
    router.post('/avatar/c2c/bindAlipay', isAuthenticated, isSetPwd, controller.c2c.user.bindAlipay);//绑定支付宝
    router.get('/avatar/c2c/bindAlipay', isAuthenticated, controller.c2c.user.getBindAlipay);
    router.post('/avatar/c2c/bindWechat', isAuthenticated, isSetPwd, controller.c2c.user.bindWechat);//绑定微信
    router.get('/avatar/c2c/bindWechat', isAuthenticated, controller.c2c.user.getBindWechat);
    router.post('/avatar/c2c/authTransactionPassword', isAuthenticated, controller.c2c.user.authTransactionPassword);//验证交易密码


    router.get('/avatar/c2c/checkVersion/:version', controller.c2c.user.checkVersion);


};
