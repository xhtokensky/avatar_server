'use strict';

const fs = require('mz/fs');
const path = require('path');
const qiniu = require('./../../utils/qiniu');
const Controller = require('egg').Controller;
const uuidUtil = require('./../../utils/uuid');
const dateUtil = require('./../../utils/dateUtil');
const commonUtil = require('./../../utils/commonUtil');
const code = require("../../utils/code");
let Response = require('./../../utils/resObj');
const I18nConst = require('./../../../config/constant/i18n');
const userRule = require("../rule/user/user");
const BigNumber = require('bignumber.js');
const WAValidator = require('wallet-address-validator');
module.exports = class extends Controller {


    isInBalance(data, item) {
        for (let i = 0; i < data.length; i++) {
            if (data[i].coin_type == item) {
                return true;
            }
        }
        return false;
    }


    __getFrozenBalance(frozenBalance) {
        let n = frozenBalance.toString().substring(0, frozenBalance.toString().indexOf(".") + 5);
        return n;
    }

    async getUserBalances() {

        let response = Response();
        try {
            let json = await this.ctx.checkToken();
            let userId = json.uid;

            let data = await this.ctx.service.tokensky.userService.getUserBalances(userId);
            if (data.length == 0) {
                let data = await this.ctx.service.tokensky.userService.getuserBalanceCoinList();

                for (let i = 0; i < data.length; i++) {
                    data[i].coin_type = data[i].symbol;
                    data[i].balance = '0.00000000';
                    data[i].frozen_balance = '0.0000';
                    data[i].cny_money = 0;
                    data[i].avatar = qiniu.getSignAfterUrl(data[i].avatar, this.app.config.qiniuConfig);
                    delete data[i].symbol;
                    delete data[i].id;
                }
                response.content.data = data;
                return this.ctx.body = response;
            }

            let dataCoin = await this.ctx.service.tokensky.userService.getuserBalanceCoinList();
            if (data.length < dataCoin.length) {
                for (let i = 0; i < dataCoin.length; i++) {
                    if (!this.isInBalance(data, dataCoin[i].symbol)) {
                        let obj = {
                            coin_type: dataCoin[i].symbol,
                            balance: '0.00000000',
                            frozen_balance: '0.0000',
                            avatar: qiniu.getSignAfterUrl(dataCoin[i].avatar, this.app.config.qiniuConfig)

                        };
                        data.push(obj);
                    } else {
                        for (let j = 0; j < data.length; j++) {
                            if (data[j].coin_type == dataCoin[i].symbol) {
                                data[j].avatar = qiniu.getSignAfterUrl(data[j].avatar, this.app.config.qiniuConfig);
                                data[j].frozen_balance = data[j].frozen_balance;
                                data[j].balance = commonUtil.bigNumberMinus(data[j].balance, data[j].frozen_balance, 8);
                                delete data[j].symbol;
                            }
                        }
                    }
                }
            } else {
                for (let i = 0; i < data.length; i++) {
                    if (!data[i].coin_type) {
                        data[i].coin_type = data[i].symbol;
                        data[i].balance = '0.00000000';
                        data[i].frozen_balance = '0.0000';
                        data[i].avatar = qiniu.getSignAfterUrl(data[i].avatar, this.app.config.qiniuConfig);
                        delete data[i].symbol;
                    } else {
                        data[i].frozen_balance = data[i].frozen_balance;
                        data[i].balance = commonUtil.bigNumberMinus(data[i].balance, data[i].frozen_balance, 8);
                        data[i].avatar = qiniu.getSignAfterUrl(data[i].avatar, this.app.config.qiniuConfig);
                        delete data[i].symbol;
                    }
                }
            }

            for (let i = 0; i < data.length; i++) {
                let usdPrice = await this.ctx.service.mongodb.quoteService.findOneQuoteUSDBySymbol(data[i].coin_type);
                let cny_money = 0;
                if (usdPrice > 0 && parseFloat(data[i].balance) > 0) {
                    let coinToprice = commonUtil.bigNumberMultipliedBy(data[i].balance, usdPrice);
                    cny_money = coinToprice * 7;
                }
                data[i].cny_money = cny_money.toFixed(2);
            }

            response.content.data = data;
            return this.ctx.body = response;
        } catch
            (e) {
            this.ctx.logger.error('Avatar getUserBalances error:', e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }


    async getUserSumBalance() {

        let {ctx} = this;
        let response = Response();

        try {
            let json = await this.ctx.checkToken();
            let userId = json.uid;

            let data = await this.ctx.service.tokensky.userService.getUserBalances(userId);

            let result = {};
            if (data.length == 0) {
                result.balance = 0;
                result.usd = 0;
            } else {
                let btcBalance = 0;//btc个数

                let USD = 0;//美元

                let otherUSD = 0;

                for (let i = 0; i < data.length; i++) {
                    let balance = commonUtil.bigNumberMinus(data[i].balance, data[i].frozen_balance);
                    let usdPrice = await this.ctx.service.mongodb.quoteService.findOneQuoteUSDBySymbol(data[i].coin_type);
                    if (data[i].coin_type == 'BTC') {
                        btcBalance = commonUtil.bigNumberPlus(btcBalance, balance);
                    } else {
                        let coinToprice = commonUtil.bigNumberMultipliedBy(balance, usdPrice);
                        otherUSD = commonUtil.bigNumberPlus(otherUSD, coinToprice);
                    }
                    //所有的货币转美元
                    let coinToprice = commonUtil.bigNumberMultipliedBy(balance, usdPrice);
                    USD = commonUtil.bigNumberPlus(USD, coinToprice);
                }

                let usdPrice = await this.ctx.service.mongodb.quoteService.findOneQuoteUSDBySymbol('BTC');
                if (usdPrice > 0) {
                    let otherCoinToBTC = commonUtil.bigNumberDiv(otherUSD, usdPrice, 8);
                    btcBalance = commonUtil.bigNumberPlus(btcBalance, otherCoinToBTC);
                    btcBalance = btcBalance.toFixed(8);
                }
                result.usd = USD.toFixed(8);
                result.balance = btcBalance;
            }
            let profit = await this.ctx.service.tokensky.userService.getUserYesterdayProfit(userId);
            result.profit = profit.toFixed(8);

            response.content.data = result;
            return ctx.body = response;

        } catch (e) {
            console.error(`getUserSumBalance error:`, e.message);
            ctx.logger.error(`getUserSumBalance error:`, e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }


    async getuserBalanceCoinList() {
        let response = Response();
        try {

            let data = await this.ctx.service.tokensky.userService.getuserBalanceCoinList();
            for (let i = 0; i < data.length; i++) {
                data[i].avatar = qiniu.getSignAfterUrl(data[i].avatar, this.app.config.qiniuConfig);
            }
            response.content.data = data;

            return this.ctx.body = response;

        } catch (e) {
            this.ctx.logger.error('Avatar getuserBalanceCoinList error:', e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }


    async getTransactionRecord() {
        let response = Response();
        try {
            let json = await this.ctx.checkToken();
            let userId = json.uid;
            let body = this.ctx.request.body;
            let index = body.pageIndex || 1;
            let pageSize = body.pageSize ? body.pageSize : 20;
            let pageIndex = (index - 1) * pageSize;

            let coinType = body.coinType;
            let category = body.category;
            let params = {
                pageIndex: pageIndex,
                pageSize: pageSize,
                userId: userId,
                coinType: coinType,
                category: category
            };
            let data = await this.ctx.service.tokensky.userService.getTransactionRecord(params);
            for (let i = 0; i < data.length; i++) {
                data[i].push_time = dateUtil.format(data[i].push_time);
                //data[i].tran_type = this.ctx.I18nMsg(I18nConst[data[i].tran_type]);
            }
            let count = await this.ctx.service.tokensky.userService.getTransactionRecordCount(params);
            response.content.data = data;
            response.content.currentPage = index;
            response.content.totalPage = count;
            return this.ctx.body = response;
        } catch (e) {
            this.ctx.logger.error('Avatar getTransactionRecord error:', e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }


    async getTransactionRecordDetails() {
        let response = Response();
        try {

            let body = this.ctx.request.body;
            let keyId = body.keyId;
            if (!keyId) {
                response.errMsg('require keyId', code.ERROR_PARAMS, 'ERROR_PARAMS');
                return this.ctx.body = response;
            }
            let transactionRecord = await this.ctx.service.tokensky.userService.findOneTransactionRecord({key_id: keyId});
            if (!transactionRecord) {
                response.errMsg(this.ctx.I18nMsg(I18nConst.NoSuchTransaction), code.ERROR_PARAMS, 'ERROR_PARAMS');
                return this.ctx.body = response;
            }
            let relevanceId = transactionRecord.relevance_id;
            let relevanceCategory = transactionRecord.relevance_category;

            let result = {
                order_id: '',//订单id
                from: '',    //从
                to: '',      //到
                category: '',//类型
                value: '',   //值
                status: 1,  //状态
                create_time: ''//创建时间
            };
            if (relevanceCategory === 'tibi') {
                /*let object = await this.ctx.service.tokensky.userService.findOneTibi({order_id: relevanceId});
                if (!object) {
                    response.errMsg('没有找到该交易', code.ERROR_PARAMS, 'ERROR_PARAMS');
                    return this.ctx.body = response;
                }
                result.order_id = object.order_id;
                result.from = '官方';
                result.to = object.in_address;
                result.category = 'tibi';
                result.value = object.quantity;
                result.create_time = dateUtil.format(object.push_time);
                if (object.status == 0 || object.status == 3) {
                    result.status = 0;
                } else if (object.status == 1) {
                    result.status = 1;
                } else if (object.status == 2 || object.status == 4) {
                    result.status = 2;
                }*/
                let object = await this.ctx.service.tokensky.userService.findOneTibi({order_id: relevanceId});
                if (!object) {
                    response.errMsg(this.ctx.I18nMsg(I18nConst.NoSuchTransaction), code.ERROR_PARAMS, 'ERROR_PARAMS');
                    return this.ctx.body = response;
                }
                let result = {
                    quantity: object.sum_quantity,
                    service_charge_quantity: object.service_charge_quantity,
                    coin_type: object.coin_type,
                    out_address: object.out_address,
                    in_address: object.in_address,
                    txid: object.txid,
                    order_id: object.order_id,
                    push_time: dateUtil.format(object.push_time),
                    finish_time: object.finish_time ? dateUtil.format(object.finish_time) : ''
                };
                if (object.status == 0 || object.status == 3) {
                    result.status = 0;
                } else if (object.status == 1) {
                    result.status = 1;
                } else if (object.status == 2 || object.status == 4) {
                    result.status = 2;
                }
                result.txid_url = '';
                if (object.txid) {
                    if (object.coin_type == 'BTC') {
                        result.txid_url = `https://www.blockchain.com/btc/tx/${object.txid}`
                    } else if (object.coin_type == 'USDT') {
                        result.txid_url = `https://omniexplorer.info/tx/${object.txid}`
                    }
                }
                let usdPrice = await this.ctx.service.mongodb.quoteService.findOneQuoteUSDBySymbol(result.coin_type);
                let cnyPrice = commonUtil.bigNumberMultipliedBy(usdPrice, 7, 8);
                result.cny_money = commonUtil.bigNumberMultipliedBy(cnyPrice, result.quantity, 2);
                response.content.data = result;
                return this.ctx.body = response;
            } else if (relevanceCategory === 'chongbi') {
                let object = await this.ctx.service.tokensky.userService.findOneChongbi({order_id: relevanceId});
                if (!object) {
                    response.errMsg(this.ctx.I18nMsg(I18nConst.NoSuchTransaction), code.ERROR_PARAMS, 'ERROR_PARAMS');
                    return this.ctx.body = response;
                }
                let result = {
                    quantity: object.amount,
                    service_charge_quantity: 0,
                    coin_type: object.coin_type,
                    out_address: '',
                    in_address: object.to_address,
                    txid: object.txid,
                    order_id: object.order_id,
                    finish_time: dateUtil.format(object.create_time)
                };
                result.txid_url = '';
                if (object.txid) {
                    if (object.coin_type == 'BTC') {
                        result.txid_url = `https://www.blockchain.com/btc/tx/${object.txid}`
                    } else if (object.coin_type == 'USDT') {
                        result.txid_url = `https://omniexplorer.info/tx/${object.txid}`
                    }
                }
                let usdPrice = await this.ctx.service.mongodb.quoteService.findOneQuoteUSDBySymbol(result.coin_type);
                let cnyPrice = commonUtil.bigNumberMultipliedBy(usdPrice, 7, 8);
                result.cny_money = commonUtil.bigNumberMultipliedBy(cnyPrice, result.quantity, 2);
                response.content.data = result;
                return this.ctx.body = response;
            } else if (relevanceCategory === 'hashrateOrder') {//算力合约
                let object = await this.ctx.service.tokensky.userService.findOneHashrateOrder({order_id: relevanceId});
                if (!object) {
                    response.errMsg(this.ctx.I18nMsg(I18nConst.NoSuchTransaction), code.ERROR_PARAMS, 'ERROR_PARAMS');
                    return this.ctx.body = response;
                }
                result.order_id = object.order_id;
                result.from = '官方';
                result.to = object.nick_name;
                result.category = 'hashrateOrder';
                result.value = object.transaction_money;
                result.create_time = dateUtil.format(object.pay_time);
            } else if (relevanceCategory === 'otcOrder') {
                let object = await this.ctx.service.tokensky.userService.findOneOtcOrderForTransactionRecord({keyId: keyId});
                if (!object) {
                    response.errMsg(this.ctx.I18nMsg(I18nConst.NoSuchTransaction), code.ERROR_PARAMS, 'ERROR_PARAMS');
                    return this.ctx.body = response;
                }
                result.order_id = object.order_id;
                if (object.tran_type.indexOf('手续费') > -1) {
                    result.to = '官方';
                    let user = {};
                    if (object.order_type == 1) {//买入
                        user = await this.ctx.service.tokensky.userService.findOneUser(object.vendee_user_id);
                    } else {//卖出
                        user = await this.ctx.service.tokensky.userService.findOneUser(object.vendor_user_id);
                    }
                    if (user) {
                        result.from = user.nick_name;
                    }
                } else {
                    let vendeeUser = await this.ctx.service.tokensky.userService.findOneUser(object.vendee_user_id);
                    if (vendeeUser) {
                        result.to = vendeeUser.nick_name;
                    }
                    let vendorUser = await this.ctx.service.tokensky.userService.findOneUser(object.vendor_user_id);
                    if (vendorUser) {
                        result.from = vendorUser.nick_name;
                    }
                }
                result.category = 'otcOrder';
                result.value = object.money;
                result.create_time = dateUtil.format(object.push_time);
            } else if (relevanceCategory === 'hashrateOrderProfit') {
                let object = await this.ctx.service.tokensky.userService.findOneHashrateOrderProfit({order_id: relevanceId});
                if (!object) {
                    response.errMsg(this.ctx.I18nMsg(I18nConst.NoSuchTransaction), code.ERROR_PARAMS, 'ERROR_PARAMS');
                    return this.ctx.body = response;
                }
                result.order_id = object.order_id;
                result.from = '官方';
                let user = await this.ctx.service.tokensky.userService.findOneUser(object.user_id);
                if (user) {
                    result.to = user.nick_name;
                }
                result.category = 'hashrateOrderProfit';
                result.value = object.profit;
                result.create_time = dateUtil.format(object.create_time);
            } else if (relevanceCategory === 'chongElectricityOrder') {
                let object = await this.ctx.service.tokensky.userService.findOneUserChongElectricityOrder({order_id: relevanceId});
                if (!object) {
                    response.errMsg(this.ctx.I18nMsg(I18nConst.NoSuchTransaction), code.ERROR_PARAMS, 'ERROR_PARAMS');
                    return this.ctx.body = response;
                }
                result.order_id = object.order_id;
                let user = await this.ctx.service.tokensky.userService.findOneUser(object.user_id);
                if (user) {
                    result.from = user.nick_name;
                }
                result.to = '官方';
                result.category = 'chongElectricityOrder';
                result.value = object.money;
                result.create_time = dateUtil.format(object.pay_time);
            } else {
                response.errMsg(this.ctx.I18nMsg(I18nConst.IllegalType), code.ERROR_SYSTEM, 'ERROR_SYSTEM');
                return this.ctx.body = response;
            }
            response.content.data = result;
            return this.ctx.body = response;
        } catch (e) {
            this.ctx.logger.error('Avatar getTransactionRecordDetails error:', e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }


    async getEarningsRecord() {
        let response = Response();
        try {
            let {ctx} = this;
            let json = await this.ctx.checkToken();
            let userId = json.uid;
            let body = this.ctx.request.body;
            let index = body.pageIndex || 1;
            let pageSize = body.pageSize ? body.pageSize : 20;
            let pageIndex = (index - 1) * pageSize;
            let category = body.category;
            if (!category || category == 1) {
                let data = await ctx.service.tokensky.userService.getEarningsRecord(userId, pageIndex, pageSize);
                for (let i = 0; i < data.length; i++) {
                    data[i].time = dateUtil.format(data[i].time);
                }
                let count = await ctx.service.tokensky.userService.getEarningsRecordCount(userId);
                response.content.data = data;
                response.content.currentPage = index;
                response.content.totalPage = count;
                return this.ctx.body = response;
            } else {
                response.content.data = [];
                response.content.currentPage = 1;
                response.content.totalPage = 0;
                return this.ctx.body = response;
            }

        } catch (e) {
            this.ctx.logger.error('Avatar getEarningsRecord error:', e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }

    async getChongbiAddress() {
        let response = Response();
        try {
            let json = await this.ctx.checkToken();
            let userId = json.uid;
            let body = this.ctx.request.body;
            let coinType = body.coinType;
            let RuleErrors = this.ctx.Rulevalidate(userRule.getChongbiAddress, body);
            if (RuleErrors != undefined) {
                let errors = RuleErrors[0];
                response.errMsg(this.ctx.I18nMsg(I18nConst.VerifyFailed) + errors.field + " " + errors.message, code.ERROR_PARAMS, 'ERROR_PARAMS');
                return this.ctx.body = response;
            }
            let obj = await this.ctx.service.tokensky.userService.getChongbiAddress({coinType, userId});
            if (!obj) {
                response.errMsg(this.ctx.I18nMsg(I18nConst.FrequentOperation), code.ERROR_SYSTEM, 'ERROR_SYSTEM');
                return this.ctx.body = response;
            }
            response.content.data = obj;
            return this.ctx.body = response;
        } catch (e) {
            this.ctx.logger.error('Avatar getChongbiAddress error:', e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }


    async getChongbiConfig() {
        let response = Response();
        try {
            let coinType = this.ctx.query.coinType;
            let obj = await this.ctx.service.tokensky.userService.getChongbiConfig(coinType);
            obj.min = obj.min ? obj.min.toFixed(8) : '';
            response.content.data = obj;
            return this.ctx.body = response;
        } catch (e) {
            this.ctx.logger.error('Avatar getChongbiConfig error:', e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }

    async getTibiConfig() {
        let response = Response();
        try {
            let coinType = this.ctx.query.coinType;
            let obj = await this.ctx.service.tokensky.userService.getTibiConfig(coinType);
            obj.min = obj.min ? obj.min.toFixed(8) : 0;
            obj.max = obj.max ? obj.max.toFixed(8) : 0;
            response.content.data = obj;
            return this.ctx.body = response;
        } catch (e) {
            this.ctx.logger.error('Avatar getTibiConfig error:', e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }

    /**
     * 新增提币纪录
     * 扣除账户金额
     * 新增交易纪录
     * 新增地址簿 没有就新增  有就不管
     * @returns {Promise<Response|Object>}
     */
    async tibi() {
        let response = Response();
        try {
            let {ctx} = this;
            let json = await this.ctx.checkToken();
            let userId = json.uid;
            let body = this.ctx.request.body;
            let RuleErrors = this.ctx.Rulevalidate(userRule.tibi, body);
            if (RuleErrors != undefined) {
                let errors = RuleErrors[0];
                response.errMsg(this.ctx.I18nMsg(I18nConst.VerifyFailed) + errors.field + " " + errors.message, code.ERROR_PARAMS, 'ERROR_PARAMS');
                return this.ctx.body = response;
            }
            let coinType = body.coinType;
            let address = body.address;
            let quantity = body.quantity;
            let remark = body.remark;

            let userInfo = await this.ctx.service.c2c.userService.getUserInfoByObj({user_id: userId});
            if (!userInfo) {
                response.errMsg(this.ctx.I18nMsg(I18nConst.UserDoesNotExist), code.ERROR_USER_NOTFOUND, 'ERROR_USER_NOTFOUND');
                return this.ctx.body = response;
            }
            if (!userInfo.transaction_password) {
                response.errMsg(this.ctx.I18nMsg(I18nConst.PleaseSetTransactionPassword), code.ERROR_SET_PWD, 'ERROR_SET_PWD');
                return this.ctx.body = response;
            }

            if (userInfo.transaction_password != commonUtil.encrypt(commonUtil.decryptTranPWDByClient(body.transactionPassword, userId),userId)) {
                response.errMsg(this.ctx.I18nMsg(I18nConst.IncorrectPassword), code.ERROR_TPWD_ERR, 'ERROR_TPWD_ERR');
                return this.ctx.body = response;
            }

            if (quantity < 0) {

                this.ctx.logger.error(`tibi error :提币个数不合法 quantity=`, quantity);
                response.errMsg(this.ctx.I18nMsg(I18nConst.IlegalParameters), code.ERROR_PARAMS, 'ERROR_PARAMS');
                return this.ctx.body = response;
            }
            let userBalance = await ctx.service.tokensky.userService.findOneUserBalance({
                user_id: userId,
                coin_type: coinType
            });
            if (!userBalance) {
                response.errMsg(this.ctx.I18nMsg(I18nConst.InsufficientBalance), code.ERROR_PARAMS, 'ERROR_PARAMS');
                return this.ctx.body = response;
            }
            if (quantity.toString().split(".")[1] && quantity.toString().split(".")[1].length > 8) {
                response.errMsg(this.ctx.I18nMsg(I18nConst.UpEightDecimal), code.ERROR_PARAMS, 'ERROR_PARAMS');
                return this.ctx.body = response;
            }
            //账户余额
            let usableCoin = commonUtil.bigNumberMinus(userBalance.balance, userBalance.frozen_balance);

            let config = await ctx.service.tokensky.userService.findOneTibiConfig(coinType);
            if (!config) {
                this.ctx.getLogger('recordLogger').info("tibi >> " + '没有找到提币配置文件');
                response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError), code.ERROR_PARAMS, 'ERROR_PARAMS');
                return this.ctx.body = response;
            }

            if (quantity < config.min) {
                response.errMsg(`min:${config.min}`, code.ERROR_PARAMS, 'ERROR_PARAMS');
                return this.ctx.body = response;
            }
            if (quantity > config.max) {
                response.errMsg(`max:${config.max}`, code.ERROR_PARAMS, 'ERROR_PARAMS');
                return this.ctx.body = response;
            }

            /*let cur_day_quantity = config.cur_day_quantity;
            if (cur_day_quantity > 0) {
                let maxTodayTibiQuantity = await ctx.service.tokensky.userService.getMaxTodayTibiQuantity(userId);
                if (maxTodayTibiQuantity >= cur_day_quantity) {
                    response.errMsg(`每天最多提币${cur_day_quantity}个`, code.ERROR_PARAMS, 'ERROR_PARAMS');
                    return ctx.body = response;
                }
                if ((maxTodayTibiQuantity + quantity) > cur_day_quantity) {
                    response.errMsg(`每天最多提币${cur_day_quantity}个,今日已提币${maxTodayTibiQuantity}个`, code.ERROR_PARAMS, 'ERROR_PARAMS');
                    return ctx.body = response;
                }
            }*/

            let base_service_charge = config.base_service_charge;

            let q = quantity;
            let service_charge = config.service_charge;//手续费汇率
            let service_charge_quantity = commonUtil.bigNumberMultipliedBy(service_charge, quantity);//手续费
            service_charge_quantity = commonUtil.bigNumberPlus(base_service_charge, service_charge_quantity);
            q = commonUtil.bigNumberMinus(q, service_charge_quantity, 8);//总的金额
            if (usableCoin < q) {
                response.errMsg(this.ctx.I18nMsg(I18nConst.InsufficientBalance), code.ERROR_PARAMS, 'ERROR_PARAMS');
                return this.ctx.body = response;
            }

            try {
                let valid = WAValidator.validate(address, coinType, 'both');
                if (!valid) {
                    response.errMsg(this.ctx.I18nMsg(I18nConst.IllegalAddress), code.ERROR_PARAMS, 'ERROR_PARAMS');
                    return this.ctx.body = response;
                }
            } catch (e) {
                response.errMsg(this.ctx.I18nMsg(I18nConst.IllegalAddress), code.ERROR_PARAMS, 'ERROR_PARAMS');
                return this.ctx.body = response;
            }

            let params = {
                orderId: commonUtil.orderId('04'),
                coinType: coinType,
                address: address,
                userId: userId,
                remark: remark,
                quantity: quantity,
                service_charge_quantity: service_charge_quantity,
                service_charge: service_charge,
                sum_quantity: q,
                base_service_charge: base_service_charge
            };

            this.ctx.getLogger('recordLogger').info("tibi >> " + JSON.stringify(params));
            let save = await ctx.service.tokensky.userService.tibi(params);

            if (!save) {
                this.ctx.logger.error(`提币失败`);
                response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError), code.ERROR_SYSTEM, 'ERROR_SYSTEM');
                return ctx.body = response;
            } else if (save == -1) {
                response.errMsg(this.ctx.I18nMsg(I18nConst.FrequentOperation), code.ERROR_SYSTEM, 'ERROR_SYSTEM');
                return ctx.body = response;
            }

            return ctx.body = response;
        } catch (e) {
            this.ctx.logger.error('Avatar tibi error:', e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }

    async isLogin() {
        let response = Response();
        return this.ctx.body = response;

    }

    async tranPWD() {
        let response = Response();
        try {
            let json = await this.ctx.checkToken();
            let userId = json.uid;
            let user = await this.ctx.service.c2c.userService.getUserInfoByObj({user_id: userId});
            if (user.transaction_password) {
                response.content.data = 1;
            } else {
                response.content.data = 0;
            }
            return this.ctx.body = response;
        } catch (e) {
            this.ctx.logger.error('Avatar tranPWD error:', e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }

    async getMaxBalance() {
        let response = Response();
        try {
            let json = await this.ctx.checkToken();
            let userId = json.uid;
            let body = this.ctx.request.body;
            let coinType = body.coinType;
            let RuleErrors = this.ctx.Rulevalidate(userRule.getMaxBalance, body);
            if (RuleErrors != undefined) {
                let errors = RuleErrors[0];
                response.errMsg(this.ctx.I18nMsg(I18nConst.VerifyFailed) + errors.field + " " + errors.message, code.ERROR_PARAMS, 'ERROR_PARAMS');
                return this.ctx.body = response;
            }
            let userBalance = await this.ctx.service.tokensky.userService.findOneUserBalance({
                user_id: userId,
                coin_type: coinType
            });
            if (!userBalance) {
                response.content.data = {
                    max_balance: 0
                };
                return this.ctx.body = response;
            }
            if (userBalance.frozen_balance < 0) {
                this.ctx.logger.error(`tibi error : 冻结金额小于0 ：userId:${userId}`);
                response.errMsg('账号异常', code.ERROR_SYSTEM, 'ERROR_SYSTEM');
                return this.ctx.body = response;
            }
            let balance = commonUtil.bigNumberMinus(userBalance.balance, userBalance.frozen_balance);


            /*let tibiConfig = await this.ctx.service.tokensky.userService.findOneTibiConfig(coinType);

            let service_charge = tibiConfig ? tibiConfig.service_charge : 0;

            let service_charge_balance = commonUtil.bigNumberMultipliedBy(service_charge, balance);

            let base_service_charge = tibiConfig.base_service_charge;

            let max_balance = commonUtil.bigNumberMinus(balance, (commonUtil.bigNumberPlus(service_charge_balance, base_service_charge)), 8);
*/
            response.content.data = {
                max_balance: balance.toFixed(8)
            };
            return this.ctx.body = response;
        } catch (e) {
            this.ctx.logger.error('Avatar getMaxBalance error:', e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }


    async updateHeadimg() {
        let {ctx} = this;
        let response = Response();
        try {
            let json = await this.ctx.checkToken();
            let userId = json.uid;
            let body = this.ctx.request.body;
            let RuleErrors = this.ctx.Rulevalidate(userRule.updateHeadimg, body);
            if (RuleErrors != undefined) {
                let errors = RuleErrors[0];
                response.errMsg(this.ctx.I18nMsg(I18nConst.VerifyFailed) + errors.field + " " + errors.message, code.ERROR_PARAMS, 'ERROR_PARAMS');
                return this.ctx.body = response;
            }
            let headimg = body.headimg;
            let adStatus = await ctx.service.tokensky.userService.updateHeadimg(headimg, userId);
            if (!adStatus) {
                response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
                return ctx.body = response;
            }
            return ctx.body = response;
        } catch (e) {
            console.error(`updateHeadimg error:`, e.message);
            ctx.logger.error(`updateHeadimg error:`, e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }

    getPhoneAreaCode() {
        let {ctx} = this;
        let response = Response();
        try {
            let data = require('./../../../config/phone.area.code.json');
            response.content.data = data;
            return ctx.body = response;
        } catch (e) {
            console.error(`getPhoneAreaCode error:`, e.message);
            ctx.logger.error(`getPhoneAreaCode error:`, e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }


    async userRegistrationId() {
        let {ctx} = this;
        let response = Response();
        try {
            let json = await this.ctx.checkToken();
            let userId = json.uid;
            let body = this.ctx.request.body;
            let registrationId = body.registrationId;
            let RuleErrors = this.ctx.Rulevalidate(userRule.userRegistrationId, body);
            if (RuleErrors != undefined) {
                let errors = RuleErrors[0];
                response.errMsg(this.ctx.I18nMsg(I18nConst.VerifyFailed) + errors.field + " " + errors.message, code.ERROR_PARAMS, 'ERROR_PARAMS');
                return this.ctx.body = response;
            }

            let reg = await this.ctx.service.tokensky.userService.findOneJiguangRegistrationid({user_id: userId});
            if (reg) {
                let params = {
                    registration_id: registrationId,
                    update_time: dateUtil.currentDate()
                };
                await this.ctx.service.tokensky.userService.updateJiguangRegistrationid(params, {user_id: userId});
            } else {
                await this.ctx.service.tokensky.userService.addJiguangRegistrationid({
                    registration_id: registrationId,
                    user_id: userId
                });
            }
            return ctx.body = response;
        } catch (e) {
            console.error(`userRegistrationId error:`, e.message);
            ctx.logger.error(`userRegistrationId error:`, e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }

    async serviceContract() {
        let response = Response();
        let headerI18n = this.ctx.header.i18n || 'zh-CN';
        if (headerI18n == 'en-US') {
            let data = this.app.config.protocol.US;
            response.content.data = data;
        } else {
            let data = this.app.config.protocol.CN;
            response.content.data = data;
        }
        return this.ctx.body = response;
    }

    async getUserShare() {
        let {ctx} = this;
        let response = Response();
        try {
            let json = await this.ctx.checkToken();
            let userId = json.uid;
            let user = await this.ctx.service.tokensky.userService.findOneUser(userId);
            if (!user) {
                response.errMsg(this.ctx.I18nMsg(I18nConst.UserDoesNotExist), code.ERROR_USER_NOTFOUND, 'ERROR_USER_NOTFOUND');
                return this.ctx.body = response;
            }
            if (user.invitation == 1) {
                let userShareUrl = this.app.config.userShareUrl + "?from=" + commonUtil.encryptWithAes(userId);
                response.content = userShareUrl;
                return this.ctx.body = response;
            } else {
                response.errMsg('暂没有权限邀请', code.ERROR_PARAMS, 'ERROR_PARAMS');
                return this.ctx.body = response;
            }

        } catch (e) {
            console.error(`getUserShare error:`, e.message);
            ctx.logger.error(`getUserShare error:`, e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }

    /// 用户申述(客服工单)
    async userAppeal(){
        let {ctx} = this;
        let response = Response();
        try {
            let json = await this.ctx.checkToken();
            let userId = json.uid;
            let user = await this.ctx.service.tokensky.userService.findOneUser(userId);
            if (!user) {
                response.errMsg(this.ctx.I18nMsg(I18nConst.UserDoesNotExist), code.ERROR_USER_NOTFOUND, 'ERROR_USER_NOTFOUND');
                return this.ctx.body = response;
            }
            let body = this.ctx.request.body;
            let casueData = body.casueStr;
            let proofImg = body.proofImgStr;
            console.log('==userAppeal==>body =', body,userId);

            if (!!proofImg && !!casueData) {
                let resBool = await this.ctx.service.c2c.userService.addUserAppeal(userId, casueData, proofImg);
                if(resBool == false || resBool == null){
                    response.errMsg('内容出错啦', code.ERROR_ADD_DATA, 'ERROR_ADD_DATA');
                    return this.ctx.body = response;
                }
                return this.ctx.body = response;
            } else {
                response.errMsg('内容出错啦', code.ERROR_PARAMS, 'ERROR_PARAMS');
                return this.ctx.body = response;
            }

        } catch (e) {
            console.error(`userAppeal error:`, e.message);
            ctx.logger.error(`userAppeal error:`, e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        } 
    }

    /// 绑定矿池用户数据
    async bindOrepoolUser(){
        let {ctx} = this;
        let response = Response();
        try{
            let userId = this.ctx.query.userId;       /// 比特分配的id
            let phoneNum = this.ctx.query.phoneNum;   /// 注册时填写的手机号

        }catch(err){
            //console.error(`bindOrepoolUser error:`, err.message);
            ctx.logger.error(`bindOrepoolUser error:`, err.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + err.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }
    
    async test() {
        /* let url = 'http://ptnj9tzkn.bkt.clouddn.com/3.jpeg';
         let aliyun = require('./../../utils/aliyun');
         let d = await aliyun.ocrDiscern.call(this, url);
         return this.ctx.body = d;*/
        /*let requestHttp = require('./../../utils/requestHttp');
        let params = {
            change:{
                uid:1002,
                methodBalance:'add',
                balance:1+"",
                symbol:'BTC',
                signId:'test'
            },
            mold:'tibi',
            cont: '提币'
        };
        let d = await requestHttp.postAssets.call(this, params);

        this.ctx.body = d;*/
    }

};

