'use strict';

const Service = require('egg').Service;
const dbName = "TokenskyAvatarDB";
const table = require('./../../../config/constant/table');

class sysMessageService extends Service {

    async getSysMessageList(userId, pageSize, startNum) {
        let sql = `SELECT * 
                FROM ${table.TOKENSKY_MESSAGE}
                WHERE status = 1
                AND (type = 0 or user_id=?)
                ORDER BY create_time DESC
                LIMIT ?,?`;
        const result = await this.app.mysql.get(dbName).query(sql, [userId, startNum, pageSize]);
        return result
    }

    async getSysMessageTotalNum(userId) {
        let sql = `SELECT count(1) totalNum 
              FROM ${table.TOKENSKY_MESSAGE} WHERE status = 1 AND (type = 0 or user_id=?) `;
        const count = await this.app.mysql.get(dbName).query(sql, [userId]);
        return count[0].totalNum
    }

    async getRedPort(userId) {
        let sql = `select count(*) count from ${table.TOKENSKY_MESSAGE} where type=? and user_id=? `;
        const result = await this.app.mysql.get(dbName).query(sql, [1, userId]);
        let count = result[0].count ? result[0].count : 0;

        let sql2 = `select * from ${table.TOKENSKY_MESSAGE} where type=? and user_id=? `;
        const result2 = await this.app.mysql.get(dbName).query(sql2, [0, userId]);
        if (result2 && Array.isArray(result2) && result2.length > 0) {
            let data = result2;
            for (let i = 0; i < data.length; i++) {
                let obj = await this.app.mysql.get(dbName).get(table.TOKENSKY_MESSAGE_READ_RECORD, {
                    message_id: data[i].message_id,
                    user_id: userId
                });
                if (!obj) {
                    count = count + 1;
                }
            }
        }
        return count;
    }


    async findOneMessage(where) {
        let obj = await this.app.mysql.get(dbName).get(table.TOKENSKY_MESSAGE, where);
        return obj;
    }

    async findOneMessageRecord(where) {
        let obj = await this.app.mysql.get(dbName).get(table.TOKENSKY_MESSAGE_READ_RECORD, where);
        return obj;
    }

    async addMessageRecord(params) {
        let tibiResult = await conn.insert(table.TOKENSKY_MESSAGE_READ_RECORD, params);
        if (tibiResult.affectedRows == 0) {
            return false;
        }
        return tibiResult;
    }


    async updateMessage(params, where) {
        const result = await this.app.mysql.get(dbName).update(table.TOKENSKY_MESSAGE, params, {
            where: where
        });
        if (result.affectedRows == 1) {
            return true
        } else {
            return false
        }
    }

    async getNewMessage() {
        let sql = `select * from ${table.TOKENSKY_MESSAGE} where status =? and type=? order by create_time desc limit 1 `;
        const result = await this.app.mysql.get(dbName).query(sql, [1, 0]);
        return result;
    }


}

module.exports = sysMessageService;
