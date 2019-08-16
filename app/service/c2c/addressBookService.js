'use strict';

const Service = require('egg').Service;
const tableName = "tokensky_user_token";
const dbName = 'TokenskyAvatarDB';
const table = require('./../../../config/constant/table');

class AddressBookService extends Service {


    async addAddressBook(params) {
        let address_id = params.address_id;
        try {
            if (address_id) {
                delete params.address_id;
                delete params.user_id;
                const result = await this.app.mysql.get(dbName).update(table.TOKENSKY_ADDRESS_BOOK, params, {
                    where: {
                        address_id: address_id
                    }
                });
                if (result.affectedRows == 1) {
                    return true
                } else {
                    return false
                }
            } else {
                delete params.address_id;
                const result = await this.app.mysql.get(dbName).insert(table.TOKENSKY_ADDRESS_BOOK, params);
                console.error(result)
                if (result.affectedRows == 1) {
                    return true
                } else {
                    return false
                }
            }
        } catch (e) {
            console.error(e)
            return false
        }
    }

    /**
     * 通过用户账号和userId获取用户信息
     * @param {*JSON M} whereObj
     */
    async getAddressBookByUserId(userId, receiptAddress) {
        if (receiptAddress) {
            let sql = `select * from ${table.TOKENSKY_ADDRESS_BOOK} where user_id=? and status=? and receipt_address like '%${receiptAddress}%' order by create_time desc limit 100`;
            let result = await this.app.mysql.get(dbName).query(sql, [userId, 1, receiptAddress]);
            return result;
        } else {
            let sql = `select * from ${table.TOKENSKY_ADDRESS_BOOK} where user_id=? and status=? order by create_time desc limit 100`;
            let result = await this.app.mysql.get(dbName).query(sql, [userId, 1]);
            return result;
        }
    }


    async deleteAddressBook(address_id) {
        const result = await this.app.mysql.get(dbName).update(table.TOKENSKY_ADDRESS_BOOK, {status: -1}, {
            where: {
                address_id: address_id
            }
        });
        if (result.affectedRows == 1) {
            return true
        } else {
            return false
        }
    }

}

module.exports = AddressBookService;
