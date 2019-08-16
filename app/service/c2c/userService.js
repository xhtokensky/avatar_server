'use strict';

const Service = require('egg').Service;
const util = require('util');
const dateUtil = require('../../utils/dateUtil');
const dbName = 'TokenskyAvatarDB';
const table = require('./../../../config/constant/table');

class UserService extends Service {


    /**
     * 新用户注册初始化用户账号
     * @param {*JSON M} jsonObj
     * */
    async register(jsonObj) {
        const conn = await this.app.mysql.get(dbName).beginTransaction(); // 初始化事务
        try {
            let addResult = await conn.insert(table.TOKENSKY_USER, jsonObj);
            let userId = addResult.insertId;
            await conn.insert(table.C2C_ACCOUNT, {user_id: userId});
            await conn.insert(table.C2C_ACCOUNT_BANK, {user_id: userId});
            let token = this.app.signToken(userId);
            await conn.insert(table.TOKENSKY_USER_TOKEN, {user_id: userId, token: token});
            await conn.commit();
            return {addStatus: true, token: token}
        } catch (error) {
            await conn.rollback();
            throw error;
        }
    }


    async getNewestPicInfoByDuid(duid, type) {
        let sql = `SELECT * 
                      FROM ${table.TOKENSKY_CHECK}
                      WHERE device_id = ? and status = ? ORDER BY update_time DESC LIMIT 1; `;
        let result = await this.app.mysql.get(dbName).query(sql, [duid, type]);
        if (result.length < 1) {
            return null
        }
        return result[0]
    }

    /**
     * 通过手机号用户信息
     **/
    async getUserInfoByPhone(phone) {
        let sql = `SELECT bu.*, bs.user_status AS u_status, bs.status
                      FROM ${table.TOKENSKY_USER} AS bu
                      LEFT JOIN ${table.TOKENSKY_SMS} AS bs
                      ON bu.sms_id=bs.sms_id
                      WHERE bu.phone = ?`;
        let userInfo = await this.app.mysql.get(dbName).query(sql, [phone]);
        if (userInfo.length < 1) {
            return null
        }
        return userInfo[0]
    }

    async getNewestSmsInfoByPhone(phone, type) {
        let sql = `SELECT * 
      FROM ${table.TOKENSKY_SMS}
      WHERE phone = ? and status = ? ORDER BY update_time DESC LIMIT 1; `;
        let result = await this.app.mysql.get(dbName).query(sql, [phone, type]);
        if (result.length < 1) {
            return null;
        }
        return result[0]
    }

    /**
     * 添加用户信息服务的数据
     **/
    async addSmsInfoMessage(insertObj) {
        let result = await this.app.mysql.get(dbName).insert(table.TOKENSKY_SMS, insertObj);
        if (result.affectedRows == 1) {
            return true;
        }
        return false;
    }


    /**
     * 更改用户信息服务的数据
     **/
    async updateSmsInfoMessage(updateObj, whereObj) {
        let updateStatus = await this.app.mysql.get(dbName).update(table.TOKENSKY_SMS, updateObj, {where: whereObj});
        if (updateStatus.affectedRows > 0) {
            return true;
        }
        return false;
    }

    /**
     * 添加图片验证数据
     **/
    async addCheckCodeInfo(insertObj) {
        let result = await this.app.mysql.get(dbName).insert(table.TOKENSKY_CHECK, insertObj);
        if (result.affectedRows == 1) {
            return true;
        }
        return false;
    }


    /**
     * 通过用户账号和userId获取用户信息
     * @param {*JSON M} whereObj
     */
    async getUserInfoByObj(whereObj) {
        let userInfo = await this.app.mysql.get(dbName).get(table.TOKENSKY_USER, whereObj);
        return userInfo
    }


    /**
     * 更新用户账户密码错误
     * @param {*Int M} errNum 错误次数
     * @param {*Int M} userId 用户ID
     */
    async updateUserErrNum(errNum, userId) {
        let updateStatus = await this.app.mysql.get(dbName).update(table.TOKENSKY_USER, {pwd_error_number: errNum}, {where: {user_id: userId}})
        if (updateStatus.affectedRows > 0) {
            return true
        }
        return false
    }


    /**
     * 跟新用户登录状态
     * @param {*Int M} userId 用户ID
     * @param {*Int M} status 登录状态
     */
    async updateUserLoginStatus(userId, status) {
        let updateStatus = await this.app.mysql.get(dbName).update(table.TOKENSKY_USER, {
            is_login: status,
            last_login_time: dateUtil.currentDate()
        }, {where: {user_id: userId}})
        if (updateStatus.affectedRows > 0) {
            return true
        }
        return false
    }


    async updateUserInfo(params, condition) {
        let updateStatus = await this.app.mysql.get(dbName).update(table.TOKENSKY_USER, params, {where: condition});
        if (updateStatus.affectedRows > 0) {
            return true
        }
        return false
    }

    /**
     * 通过用户ID获取用户信息
     * @param {*Int M} userId
     */
    async getUserByUid(userId) {
        let sql = `SELECT yu.*, yut.token
            FROM ${table.TOKENSKY_USER} AS yu
            LEFT JOIN ${table.TOKENSKY_USER_TOKEN} AS yut
            ON yut.user_id=yu.user_id
            WHERE yu.user_id = ?`;
        let userInfo = await this.app.mysql.get(dbName).query(sql, [userId]);
        if (userInfo.length < 1) {
            return null
        }
        return userInfo[0]
    }


    async addAccountBank(params) {
        let result = await this.app.mysql.get(dbName).insert(table.TOKENSKY_ACCOUNT_BANK, params);
        if (result.affectedRows == 1) {
            return true;
        }
        return false;
    }

    async updateAccountBank(params, condition) {
        let updateStatus = await this.app.mysql.get(dbName).update(table.TOKENSKY_ACCOUNT_BANK, params, {where: condition});
        if (updateStatus.affectedRows > 0) {
            return true
        }
        return false
    }

    async updateRealAuth(params, condition) {
        let updateStatus = await this.app.mysql.get(dbName).update(table.TOKENSKY_REAL_AUTH, params, {where: condition});
        if (updateStatus.affectedRows > 0) {
            return true
        }
        return false
    }

    async addRealAuth(params) {
        let result = await this.app.mysql.get(dbName).insert(table.TOKENSKY_REAL_AUTH, params);
        if (result.affectedRows == 1) {
            return true;
        }
        return false;
    }

    async addRealAuthInfo(params) {
        let result = await this.app.mysql.get(dbName).insert(table.TOKENSKY_REAL_AUTH_INFO, params);
        if (result.affectedRows == 1) {
            return true;
        }
        return false;
    }

    async realAuthStep2(params) {
        let identity_card_picture = params.identity_card_picture;
        let identity_card_picture2 = params.identity_card_picture2;
        let user_id = params.user_id;
        let name = params.name;
        let nation = params.nation;
        let address = params.address;
        let identity_card = params.identity_card;
        let birthday = params.birthday;
        let sex = params.sex;
        let expiry_date = params.expiry_date;
        let issuing_authority = params.issuing_authority;
        let issuing_date = params.issuing_date;

        const conn = await this.app.mysql.get(dbName).beginTransaction(); // 初始化事务
        try {
            let realAuthParams = {
                identity_card_picture: identity_card_picture,
                identity_card_picture2: identity_card_picture2
            };
            let realAuthCondition = {
                user_id: user_id
            };
            let upStatus = await conn.update(table.TOKENSKY_REAL_AUTH, realAuthParams, {where: realAuthCondition});
            if (upStatus.affectedRows == 0) {
                await conn.rollback();
                return false;
            }

            let realAuthInfoParams = {
                user_id: user_id,
                name: name,
                nation: nation,
                address: address,
                identity_card: identity_card,
                birthday: birthday,
                sex: sex,
                expiry_date: expiry_date,
                issuing_authority: issuing_authority,
                issuing_date: issuing_date
            };

            let adStatus = await conn.insert(table.TOKENSKY_REAL_AUTH_INFO, realAuthInfoParams);

            if (adStatus.affectedRows == 0) {
                await conn.rollback();
                return false;
            }

            await conn.commit();
            return true;

        } catch (e) {
            await conn.rollback();
            throw e;
            this.ctx.getLogger('recordLogger').error(`realAuthStep2 service error : ${e.message}`);
            return false;
        }
    }

    async realAuthStep3(params) {
        let user_id = params.user_id;
        let confidence = params.confidence;
        let person_picture = params.person_picture;

        const conn = await this.app.mysql.get(dbName).beginTransaction(); // 初始化事务

        try {
            let upStatus = await conn.update(table.TOKENSKY_REAL_AUTH, {person_picture: person_picture}, {where: {user_id: user_id}});
            if (upStatus.affectedRows == 0) {
                await conn.rollback();
                return false;
            }

            let upStatus2 = await conn.update(table.TOKENSKY_REAL_AUTH_INFO, {confidence: confidence}, {where: {user_id: user_id}});
            if (upStatus2.affectedRows == 0) {
                await conn.rollback();
                return false;
            }

            await conn.commit();
            return true;

        } catch (e) {
            await conn.rollback();
            throw e;
            this.ctx.getLogger('recordLogger').error(`realAuthStep3 service error : ${e.message}`);
            return false;
        }
    }


    async findOneRealAuth(params) {
        let obj = await this.app.mysql.get(dbName).get(table.TOKENSKY_REAL_AUTH, params);
        return obj;
    }

    async getAccountBankList(userId, type, columns) {
        let list = await this.app.mysql.get(dbName).select(table.TOKENSKY_ACCOUNT_BANK, {
            where: {
                user_id: userId,
                type: type
            },
            columns: columns
        });
        if (!list) {
            list = [];
        }
        return list
    }

    async getBanners() {

        let list = await this.app.mysql.get(dbName).select(table.OPERATION_BANNER, {
            where: {
                status: 1
            }
        });
        if (!list) {
            list = [];
        }
        return list
    }

    /**
     * 更新用户基本信息 昵称 邮箱 性别
     * @param {*JSON} updateObj
     * @param {*JSON} whereObj
     */
    async modifyUserInfo(updateObj, whereObj) {
        let updateStatus = await this.app.mysql.get(dbName).update(table.TOKENSKY_USER, updateObj, {where: whereObj});
        if (updateStatus.affectedRows > 0) {
            return true
        }
        return false
    }

    async isUpdateNickName({userId, nickName}) {
        let sql = `select user_id from ${table.TOKENSKY_USER} where user_id !=? and nick_name=? `;
        let result = await this.app.mysql.get(dbName).query(sql, [userId, nickName]);
        if (result.length < 1) {
            return true
        } else {
            return false;
        }
    }


}

module.exports = UserService;
