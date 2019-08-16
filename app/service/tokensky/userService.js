'use strict';

const Service = require('egg').Service;
const moment = require('moment');
const dbName = 'TokenskyAvatarDB';
const dateUtil = require('./../../utils/dateUtil');
const commonUtil = require('./../../utils/commonUtil');
const requestHttp = require('./../../utils/requestHttp');
const WAValidator = require('wallet-address-validator');
const table = require('./../../../config/constant/table');

class UserService extends Service {

    async getUserBalances(userId) {
        let sql = `select ub.coin_type,ub.balance,ub.frozen_balance,ubc.symbol,ubc.avatar from ${table.TOKENSKY_USER_BALANCE} ub left join ${table.TOKENSKY_USER_BALANCE_COIN} ubc on ub.coin_type = ubc.symbol  where if(ub.user_id,ub.user_id= ?,1=1) `;
        let data = await this.app.mysql.get(dbName).query(sql, [userId]);
        return data;
    }

    async findOneUserBalance({userId, coinType}) {
        let sql = `select * from ${table.TOKENSKY_USER_BALANCE} where coin_type=? and user_id=? `;
        let data = await this.app.mysql.get(dbName).query(sql, [coinType, userId]);
        if (data[0]) {
            return data[0];
        } else {
            return null;
        }
    }

    async getTransactionRecord({userId, pageIndex, pageSize, coinType, category}) {
        let sql = `select * from ${table.TOKENSKY_TRANSACTION_RECORD} where user_id = ? `;
        if (coinType) {
            sql += ` AND coin_type = '${coinType}' `;
        }
        if (category) {
            sql += ` AND category = ${category} `
        }
        sql += ` order by push_time desc `;
        sql += ` LIMIT ?,? `;
        let result = await this.app.mysql.get(dbName).query(sql, [userId, pageIndex, pageSize]);
        return result;
    }

    async getTransactionRecordCount({userId, pageIndex, pageSize, coinType, category}) {
        let sql = `select count(*) count from ${table.TOKENSKY_TRANSACTION_RECORD} where user_id = ? `;
        if (coinType) {
            sql += ` AND coin_type = '${coinType}' `;
        }
        if (category) {
            sql += ` AND category = ${category} `
        }
        let result = await this.app.mysql.get(dbName).query(sql, [userId]);
        return result[0].count ? result[0].count : 0;
    }


    async findOneRoleBlack(balckType, phone) {
        let sql = `select * from ${table.ROLE_BLACK_LIST} where balck_type = ? and phone=? order by end_time desc `;
        let result = await this.app.mysql.get(dbName).query(sql, [balckType, phone]);
        if (result.length < 1) {
            return null;
        }
        return result[0];
    }

    async getuserBalanceCoinList() {
        let sql = `select id,symbol,avatar from ${table.TOKENSKY_USER_BALANCE_COIN} where status = 1 `;
        let result = await this.app.mysql.get(dbName).query(sql);
        return result;
    }


    async findOneUserBalanceCoin(symbol) {
        let obj = await this.app.mysql.get(dbName).get(table.TOKENSKY_USER_BALANCE_COIN, {
            symbol: symbol,
            status: 1
        });
        return obj;
    }

    async findChongbiAddress({coinType, userId}) {
        let userAddress = await this.app.mysql.get(dbName).get(table.TOKENSKY_USER_ADDRESS, {
            coin_type: coinType,
            user_id: userId,
            status: 1
        });
        return userAddress;
    }

    async getChongbiAddress({coinType, userId}) {
        let userAddress = await this.app.mysql.get(dbName).get(table.TOKENSKY_USER_ADDRESS, {
            coin_type: coinType,
            user_id: userId,
            status: 1
        });
        if (userAddress) {
            return {
                address: userAddress.address,
                coin_type: userAddress.coin_type,
                user_id: userAddress.user_id
            };
        }

        //分配地址
        let userAddress0 = await this.app.mysql.get(dbName).get(table.TOKENSKY_USER_ADDRESS, {
            coin_type: coinType,
            user_id: 0,
            status: 1
        });
        if (userAddress0 && userAddress0.id) {

            let id = userAddress0.id;
            let sql = `update ${table.TOKENSKY_USER_ADDRESS} set user_id=? where id=? and user_id=? `;
            let updateStatus = await this.app.mysql.get(dbName).query(sql, [userId, id, 0]);

            if (updateStatus.affectedRows == 0) {
                return null;
            }
            let obj = await this.app.mysql.get(dbName).get(table.TOKENSKY_USER_ADDRESS, {id: id});

            return {
                address: obj.address,
                coin_type: obj.coin_type,
                user_id: obj.user_id
            };
        } else {
            this.ctx.getLogger('recordLogger').info("getChongbiAddress >> " + '没有可分配的地址');
            return null;
        }

    }


    async getChongbiConfig(coinType) {
        let sql = `select min,coin_type from ${table.TOKENSKY_CHONGBI_CONFIG} where status =1 and coin_type=? `;
        let result = await this.app.mysql.get(dbName).query(sql, [coinType]);
        if (result[0]) {
            return result[0];
        } else {
            return {};
        }
    }

    async findOneTibiConfig(coinType) {
        let sql = `select * from ${table.TOKENSKY_TIBI_CONFIG} where status =? and coin_type=? `;
        let result = await this.app.mysql.get(dbName).query(sql, [1, coinType]);
        if (result[0]) {
            return result[0];
        } else {
            return null;
        }
    }

    async getTibiConfig(coinType) {
        let sql = `select min,max,coin_type,service_charge from ${table.TOKENSKY_TIBI_CONFIG} where status =1 and coin_type=? `;
        let result = await this.app.mysql.get(dbName).query(sql, [coinType]);
        if (result[0]) {
            return result[0];
        } else {
            return {};
        }
    }

    async findOneUserBalance(params) {
        let sql = `select * from ${table.TOKENSKY_USER_BALANCE} where user_id = ? and coin_type = ? `;
        let result = await this.app.mysql.get(dbName).query(sql, [params.user_id, params.coin_type]);
        if (result.length < 1) {
            return null;
        }
        return result[0];
    }


    async tibi(params) {

        const conn = await this.app.mysql.get(dbName).beginTransaction(); // 初始化事务

        try {
            let coinType = params.coinType;
            let address = params.address;
            let userId = params.userId;
            let remark = params.remark;
            let quantity = params.quantity;
            let service_charge_quantity = params.service_charge_quantity;
            let service_charge = params.service_charge;
            let sum_quantity = params.sum_quantity;
            let base_service_charge = params.base_service_charge;
            let orderId = params.orderId;

            //新增提币纪录
            let tibiParams = {
                coin_type: coinType,
                order_id: orderId,
                user_id: userId,
                in_address: address,
                quantity: sum_quantity,
                service_charge_quantity: service_charge_quantity,
                service_charge: service_charge,
                base_service_charge: base_service_charge,
                sum_quantity: quantity,
                push_time: dateUtil.currentDate(),
                status: 0
            };
            let tibiResult = await conn.insert(table.TOKENSKY_USER_TIBI, tibiParams);
            if (tibiResult.affectedRows == 0) {
                await conn.rollback();
                return false;
            }

            let _oid = await conn.get(table.TOKENSKY_ORDER_IDS, {order_id: orderId});
            if (_oid) {
                this.ctx.logger.error(`tibi error:order_id已存在`);
                await conn.rollback();
                return false;
            }
            let orderidsResult = await conn.insert(table.TOKENSKY_ORDER_IDS, {order_id: orderId});
            if (orderidsResult.affectedRows == 0) {
                await conn.rollback();
                return false;
            }


            let tibiKeyid = tibiResult.insertId;

            //新增交易纪录
            let tranParams = {
                coin_type: coinType,
                tran_type: '提币',
                push_time: dateUtil.currentDate(),
                category: 2,
                user_id: userId,
                money: quantity,
                status: 0,
                relevance_category: "tibi",
                relevance_id: orderId,
                in_address: address
            };
            let tranResult = await conn.insert(table.TOKENSKY_TRANSACTION_RECORD, tranParams);
            if (tranResult.affectedRows == 0) {
                await conn.rollback();
                return false;
            }

            /*let tranServiceCharge = {
                coin_type: coinType,
                tran_type: '提币手续费',
                push_time: dateUtil.currentDate(),
                category: 2,
                user_id: userId,
                money: service_charge_quantity,
                status: 0,
                relevance_category: "tibi",
                relevance_id: orderId
            };
            let tranServiceChargeResult = await conn.insert(table.TOKENSKY_TRANSACTION_RECORD, tranServiceCharge);
            if (tranServiceChargeResult.affectedRows == 0) {
                await conn.rollback();
                return false;
            }*/


            let addressBook = await conn.get(table.TOKENSKY_ADDRESS_BOOK, {
                user_id: userId,
                receipt_address: address,
                wallet_type_name: coinType
            });

            if (!addressBook) {
                let addressBookParams = {
                    user_id: userId,
                    receipt_address: address,
                    wallet_type_name: coinType,
                    status: 1,
                    address_name: remark || '',
                    wallet_type_id: 0
                };
                let addressBookResult = await conn.insert(table.TOKENSKY_ADDRESS_BOOK, addressBookParams);
                if (addressBookResult.affectedRows == 0) {
                    await conn.rollback();
                    return false;
                }
            }


            //修改用户资产
            let assetsParams = {
                change: {
                    uid: userId,
                    methodFrozenBalance: 'add',
                    frozenBalance: quantity,
                    symbol: coinType,
                    signId: orderId
                },
                mold: 'tibi',
                cont: '提币'
            };
            let assetsResult = await requestHttp.postAssets.call(this, assetsParams);
            if (!assetsResult.success) {
                await conn.rollback();
                return false;
            }
            let hashId = assetsResult.hashId;

            let hashSql = `update ${table.TOKENSKY_USER_BALANCE_HASH} set model_status=? where hash_id=? `;
            let hashResult = await conn.query(hashSql, [1, hashId]);
            if (hashResult.affectedRows == 0) {
                this.ctx.logger.error(`tibi update hash fail:hashId==${hashId},userId=${userId}`);
            }

            await conn.commit();
            return true;
        } catch (e) {
            await conn.rollback();
            throw e;
            this.ctx.getLogger('recordLogger').error(`tibi service error : ${e.message}`);
            return false;
        }
    }

    async getUserYesterdayProfit(userId) {
        let yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
        let sql = `select money,coin_type from ${table.TOKENSKY_TRANSACTION_RECORD} where DATE_FORMAT(push_time,'%Y-%m-%d')=? and user_id = ? and category=? and status=? `;
        let result = await this.app.mysql.get(dbName).query(sql, [yesterday, userId, 1, 1]);
        if (!result || result.length == 0) {
            return 0;
        }
        let profit = 0;
        let money = 0;
        let btcPrice = 0;
        let otherCoinToBTC = 0;
        for (let i = 0; i < result.length; i++) {
            let usdPrice = await this.ctx.service.mongodb.quoteService.findOneQuoteUSDBySymbol(result[i].coin_type);
            if (result[i].coin_type = 'BTC') {
                profit = commonUtil.bigNumberPlus(profit, result[i].money);
                btcPrice = usdPrice;
            } else {
                let coinToprice = commonUtil.bigNumberMultipliedBy(result[i].money, usdPrice);
                money = commonUtil.bigNumberPlus(money, coinToprice);
            }
        }
        if (money > 0 && btcPrice > 0) {
            otherCoinToBTC = commonUtil.bigNumberDiv(money, btcPrice);
        }
        let r = commonUtil.bigNumberPlus(profit, otherCoinToBTC);
        return r;
    }

    async getMaxTodayTibiQuantity(userId) {
        let today = moment().format('YYYY-MM-DD');
        let sql = `select sum(quantity) quantity from ${table.TOKENSKY_USER_TIBI} where user_id=? and DATE_FORMAT(push_time,'%Y-%m-%d')=? and status !=? `;
        let result = await this.app.mysql.get(dbName).query(sql, [userId, today, 2]);
        return result[0].quantity ? result[0].quantity : 0
    }

    async getEarningsRecord(userId, pageIndex, pageSize) {
        let sql = `select id,create_time as time,profit as quantity,category_name as name from ${table.HASHRATE_ORDER_PROFIT} where status=? and user_id=? order by isdate desc LIMIT ?,?`;
        let result = await this.app.mysql.get(dbName).query(sql, [1, userId, pageIndex, pageSize]);
        return result;
    }

    async getEarningsRecordCount(userId) {
        let sql = `select count(*) count from ${table.HASHRATE_ORDER_PROFIT} where status=? and user_id=? `;
        let result = await this.app.mysql.get(dbName).query(sql, [1, userId]);
        return result[0].count ? result[0].count : 0;
    }

    async updateHeadimg(headimg, userId) {
        let sql = `update ${table.TOKENSKY_USER} set head_img=? where user_id=? `;
        let result = await this.app.mysql.get(dbName).query(sql, [headimg, userId]);
        if (result.affectedRows == 0) {
            return false;
        }
        return true;
    }

    async findOneJiguangRegistrationid(where) {
        let obj = await this.app.mysql.get(dbName).get(table.TOKENSKY_JIGUANG_REGISTRATIONID, where);
        return obj;
    }

    async addJiguangRegistrationid(params) {
        const result = await this.app.mysql.get(dbName).insert(table.TOKENSKY_JIGUANG_REGISTRATIONID, params);
        if (result.affectedRows == 1) {
            return true
        } else {
            return false
        }
    }

    async updateJiguangRegistrationid(params, where) {
        const result = await this.app.mysql.get(dbName).update(table.TOKENSKY_JIGUANG_REGISTRATIONID, params, {
            where: where
        });
        if (result.affectedRows == 1) {
            return true
        } else {
            return false
        }
    }

    async findOneTransactionRecord(where) {
        let obj = await this.app.mysql.get(dbName).get(table.TOKENSKY_TRANSACTION_RECORD, where);
        return obj;
    }

    async findOneTibi(where) {
        let obj = await this.app.mysql.get(dbName).get(table.TOKENSKY_USER_TIBI, where);
        return obj;
    }

    async findOneChongbi(where) {
        let obj = await this.app.mysql.get(dbName).get(table.TOKENSKY_USER_DEPOSIT, where);
        return obj;
    }

    async findOneHashrateOrder({order_id}) {
        let sql = `select hot.transaction_money,ho.pay_time,ho.order_id,u.nick_name from ${table.HASHRATE_ORDER} ho,${table.HASHRATE_ORDER_TRANSACTION} hot,${table.TOKENSKY_USER} u where ho.order_id=hot.order_id and u.user_id = ho.user_id and ho.order_id=? `;
        let result = await this.app.mysql.get(dbName).query(sql, [order_id]);
        if (result.length < 1) {
            return null;
        }
        return result[0];
    }

    async findOneOtcOrderForTransactionRecord({keyId}) {
        let sql = `select tr.money,tr.tran_type,tr.push_time,ot.vendor_user_id,ot.vendee_user_id,ot.order_id,ot.order_type from ${table.TOKENSKY_TRANSACTION_RECORD} tr,${table.OTC_ORDER} ot where tr.order_id=ot.order_id and tr.key_id=? `;
        let result = await this.app.mysql.get(dbName).query(sql, [keyId]);
        if (result.length < 1) {
            return null;
        }
        return result[0];
    }

    async findOneUser(userId) {
        let obj = await this.app.mysql.get(dbName).get(table.TOKENSKY_USER, {user_id: userId});
        return obj;
    }

    async findOneHashrateOrderProfit(where) {
        let obj = await this.app.mysql.get(dbName).get(table.HASHRATE_ORDER_PROFIT, where);
        return obj;
    }

    async findOneUserChongElectricityOrder(where) {
        let obj = await this.app.mysql.get(dbName).get(table.TOKENSKY_USER_CHONG_ELECTRICITY_ORDER, where);
        return obj;
    }

    async findOneImUserRegister(where) {
        let obj = await this.app.mysql.get(dbName).get(table.TOKENSKY_JIGUANG_IM_USER_REGISTER, where);
        return obj;
    }

    async addImUserRegister(params) {
        let result = await this.app.mysql.get(dbName).insert(table.TOKENSKY_JIGUANG_IM_USER_REGISTER, params);
        if (result.affectedRows == 0) {
            return false;
        }
        return true;
    }

    async findOneJiguangRegistrationid(where) {
        let obj = await this.app.mysql.get(dbName).get(table.TOKENSKY_JIGUANG_REGISTRATIONID, where);
        return obj;
    }

    async addUserInvite(params) {
        let result = await this.app.mysql.get(dbName).insert(table.TOKENSKY_USER_INVITE, params);
        if (result.affectedRows == 0) {
            return false;
        }
        return true;
    }


}

module.exports = UserService;
