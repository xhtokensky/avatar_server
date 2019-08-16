'use strict';

const Service = require('egg').Service;
const dbName = 'TokenskyAvatarDB';
const table = require('./../../../config/constant/table');

class UserTokenService extends Service {

    /**
     * 查看token是否存在
     * @param {*String M} token
     */
    async tokenIsExist(token) {
        let count = await this.app.mysql.get(dbName).count(table.TOKENSKY_USER_TOKEN, {token: token});
        return count
    }

    /**
     * 登录更新用户token
     * @param {*Int M} userId 用户
     * @param {*String M} token
     */
    async updateUserTokenByLogin(userId, token) {
        let updateStatus = await this.app.mysql.get(dbName).update(table.TOKENSKY_USER_TOKEN, {token: token}, {where: {user_id: userId}})
        if (updateStatus.affectedRows > 0) {
            return true
        }
        return false
    }

    /**
     * 通过userId获取用户token
     * @param {*Int M} userId 用户
     */
    async getUserTokenById(userId) {
        let userToken = await this.app.mysql.get(dbName).get(table.TOKENSKY_USER_TOKEN, {user_id: userId});
        return userToken
    }

    /**
     * 退出登录更新用户token
     * @param {*Int M} userId 用户
     */
    async updateUserTokenByLoginOut(userId) {
        let updateStatus = await this.app.mysql.get(dbName).update(table.TOKENSKY_USER_TOKEN, {token: ""}, {where: {user_id: userId}})
        if (updateStatus.affectedRows > 0) {
            return true
        }
        return false
    }

}

module.exports = UserTokenService;
