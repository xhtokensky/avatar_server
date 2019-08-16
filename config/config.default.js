/* eslint valid-jsdoc: "off" */

'use strict';
const path = require('path');
/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
    /**
     * built-in config
     * @type {Egg.EggAppConfig}
     **/
    const config = exports = {};

    // use for cookie sign key, should change to your own and keep security
    config.keys = appInfo.name + '_1558523646675_2587';

    // add your middleware config here
    config.middleware = [];

    // add your user config here
    const userConfig = {
        // myAppName: 'egg',
    };


    config.mongoose = {
        client: {
            url: 'mongodb://127.0.0.1/tokenskyQuoteDB',
            options: {},
        },
    };

    // 配置mysql
    config.mysql = {
        clients: {
            TokenskyAvatarDB: {
                // 数据库名
                host: "118.31.121.239",
                user: "root",
                password: "root",
                database: 'tokensky',
            },
        },
        // 所有数据库配置的默认值
        default: {
            // host
            host: '127.0.0.1', // 54.179.154.12 139.224.115.73 172.31.21.72
            // 端口号
            port: '3306',
        },

        // 是否加载到 app 上，默认开启
        app: true,
        // 是否加载到 agent 上，默认关闭
        agent: false,
    };

    exports.security = {
        csrf: false
    };

    config.jiguang = {
        key: '9a11d6ce355150887087d0ca',
        secret: 'af4025100bbfc437e3df1726',
        sign_id: "7395",
        temp_id: "160654",
        temp_para_id: "160654",
        temp_para_login: "160654"
    };

    config.aliYun = {
        AppCode: "f9952ee8582742089a91867c84632d5d",
        AccessKeyID: "LTAI3oWNLw75Xqro",
        AccessKeySecret: "Jes3Hv329jAaxsC8m2adCrERAR9LZq",
        SignName: "TokenSky",
        CommonSignName: "深圳市融璟云科技有限公司",
        CN: {
            TemplateCodeLogin: "SMS_166980172",//登录模版
            TemplateCodeUpdate: "SMS_166980168",//修改信息模版
            TemplateCodeOTC1: "SMS_168305872",//用户卖币-对方打款
            TemplateCodeOTC2: "SMS_168310821",//用户买币-对方申诉
            TemplateCodeOTC3: "SMS_168310813",//用户买币-对方放币
        },
        US: {
            TemplateCodeLogin: "SMS_168345176",//登录模版 //国际
        }
    };

    config.customLogger = {
        recordLogger: {
            file: path.join(appInfo.root, `logs/${appInfo.name}/info-record.log`),
        },
    };


    config.smsInterval = 120

    // 模板验证
    config.sms_send_temp = "https://api.sms.jpush.cn/v1/messages"


    config.nickName = "区块链小白"; // 用户注册默认昵称
    config.tokenExpire = 30; // token的有效期
    config.tokenSecret = 'YJdark';   // 生成token的签名
    config.pwdErrNum = 5;

    exports.multipart = {
        fields: 100,
        fileSize: '5mb',
        mode: 'file',
        whitelist: [
            '.png',
            '.jpg',
            '.jpeg'
        ],
    };

    config.qiniuConfig = {
        bucketName: "test1",
        accessKey: 'gPoNjxfS1qvYnbMjccy-UbOzvviIIeOSu5xqCPa7',
        secretKey: "_hcWP1rxzAYaa75KSQGFZulSqbGzTisv4j79vmTx",
        qiniuServer: 'http://test2.hardrole.com/'
    };

    //资产服务地址
    config.assetsUrl = 'http://127.0.0.1:8888/balance/one';
    config.assetsUrlMulti = 'http://127.0.0.1:8888/balance/multi';

    //用户分享地址
    config.userShareUrl = 'https://www.baidu.com';

    //H5协议地址
    config.protocol = {
        US: {
            "otc": {
                url: 'http://118.31.121.239:8086/tokensky_static/otc_us.html'
            },
            "service_contract": {
                url: 'http://118.31.121.239:8086/tokensky_static/service_contract_us.html'
            },
            "cloud_service_contract": {
                url: 'http://118.31.121.239:8086/tokensky_static/cloud_service_contract_us.html'
            }
        },
        CN: {
            "otc": {
                url: 'http://118.31.121.239:8086/tokensky_static/otc.html'
            },
            "service_contract": {
                url: 'http://118.31.121.239:8086/tokensky_static/service_contract.html'
            },
            "cloud_service_contract": {
                url: 'http://118.31.121.239:8086/tokensky_static/cloud_service_contract.html'
            }
        }
    };


    config.cors = {
        origin: '*',
        allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS'
    };


    return {
        ...config,
        ...userConfig,
    };
};



