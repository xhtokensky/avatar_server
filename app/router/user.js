module.exports = app => {
    //交易明细表 >> hashrateOrder(算力订单消费),tibi(提币)，chongbi(充币)，otcOrder(otc订单),hashrateOrderProfit(算力收益),chongElectricityOrder(充值电费)
    /**
     * 订单生成规则  年(后2位)月日十分秒毫秒+业务码+5位随机数
     * 业务码：00(OTC买入) 01(OTC卖出) 02(购买算力合约) 03(充币) 04(提币) 05(发放合约收益) 06(充值电费) 07(理财) 08(借贷)
     */

    const {router, controller} = app;

    const isAuthenticated = app.middleware.isAuthenticated();

    router.get('/avatar/banners', controller.c2c.user.getBanners);

    router.post('/avatar/user/balance', isAuthenticated, controller.user.user.getUserBalances);

    router.post('/avatar/user/sumBalance', isAuthenticated, controller.user.user.getUserSumBalance);

    router.get('/avatar/getuserBalanceCoinList', controller.user.user.getuserBalanceCoinList);
    router.post('/avatar/transaction/record', isAuthenticated, controller.user.user.getTransactionRecord);//交易纪录
    router.post('/avatar/transaction/record/details', isAuthenticated, controller.user.user.getTransactionRecordDetails);//交易纪录详情

    router.post('/avatar/earnings/record', isAuthenticated, controller.user.user.getEarningsRecord);//收益纪录

    //获取充币地址
    router.post('/avatar/chongbi/address', isAuthenticated, controller.user.user.getChongbiAddress);

    //提币
    router.post('/avatar/tibi', isAuthenticated, controller.user.user.tibi);


    router.get('/avatar/chongbi/config', controller.user.user.getChongbiConfig);
    router.get('/avatar/tibi/config', controller.user.user.getTibiConfig);

    router.post('/avatar/isLogin', isAuthenticated, controller.user.user.isLogin);
    router.post('/avatar/tranPWD', isAuthenticated, controller.user.user.tranPWD);

    router.post('/avatar/maxBalance', isAuthenticated, controller.user.user.getMaxBalance);

    router.post('/avatar/update/headimg', isAuthenticated, controller.user.user.updateHeadimg);

    router.get('/avatar/phone/area/code', controller.user.user.getPhoneAreaCode);

    //关联极光推送registration_id
    router.post('/avatar/registrationId', isAuthenticated, controller.user.user.userRegistrationId);


    router.get('/avatar/serviceContract',controller.user.user.serviceContract);

    router.get('/avatar/getUserShare',isAuthenticated,controller.user.user.getUserShare);


    router.get('/avatar/test',controller.user.user.test);



};

//6c45d78b-10d3-4403-81a7-c129e466ccc8

//curl -H "X-CMC_PRO_API_KEY: 6c45d78b-10d3-4403-81a7-c129e466ccc8" -H "Accept: application/json" -d "start=1&limit=5000" -G https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest
