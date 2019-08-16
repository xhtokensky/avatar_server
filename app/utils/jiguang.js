"use strict";
const JPush = require("jpush-async").JPushAsync;
const rp = require('request-promise');
let client = null;

exports.ImUserRegister = async function (username, password) {
    try {
        const base64Str = new Buffer(`${this.app.config.jiguang.key}:${this.app.config.jiguang.secret}`).toString('base64');
        const options = {
            method: 'POST',
            json: true,
            url: 'https://api.im.jpush.cn/v1/users',
            body:
                [{
                    username: username,
                    password: password,
                    appkey: this.app.config.jiguang.key
                }],
            headers:
                {
                    Authorization: `Basic ${base64Str}`,
                    "Content-Type": "application/json;charset=UTF-8"
                }
        };
        let body = await rp(options);
        if (body && Array.isArray(body)) {
            if (body[0]) {
                if (!body[0].error) {
                    return body[0];
                }
            }
        }
        return null;
    } catch (e) {
        console.error(`ImUserRegister error:${e.message}`);
        this.ctx.logger.error(`ImUserRegister error:${e.message}`);
        return null;
    }
};


exports.__init = async function () {
    let key = this.config.jiguang.key;
    let secret = this.config.jiguang.secret;
    if (!client) {
        client = await JPush.buildClient(key, secret);
    }
};


/**
 * 通知 所有用户
 * @returns {Promise<void>}
 * @constructor
 */
exports.SendNotificationAll = async function ({content, title, extras}) {
    try {
        let result = await client.push().setPlatform(JPush.ALL)
            .setAudience(JPush.ALL)
            .setNotification(
                JPush.android(content, title, 1, extras),
                JPush.ios({title: title, body: content}, 'sound', 1, true, extras),
                JPush.winphone(content, title, '', extras))
            .send();
        return {success: true, result: result};
    } catch (e) {
        console.error(`SendNotificationAll error: ${e.message}`);
        this.ctx.logger.error(`SendNotificationAll error: ${e.message}`);
        return {success: false, result: {}};
    }
};

/**
 * 通知 单个用户
 * @returns {Promise<void>}
 * @constructor
 */
exports.SendNotificationByUser = async function ({content, title, userId, extras}) {
    try {
        let result = await client.push().setPlatform(JPush.ALL)
            .setAudience(JPush.registration_id(userId))
            .setNotification(
                JPush.android(content, title, 1, extras),
                JPush.ios({title: title, body: content}, 'sound', 1, true, extras),
                JPush.winphone(content, title, '', extras))
            .send();
        return {success: true, result: result};
    } catch (e) {
        console.error(`SendNotificationByUser error: ${e.message}`);
        this.ctx.logger.error(`SendNotificationByUser error: ${e.message}`);
        return {success: false, result: {}};
    }
};

/**
 * 自定义消息  全部
 * @returns {Promise<void>}
 * @constructor
 */
exports.SendMessageAll = async function ({content, title, contentType, extras}) {
    try {
        let result = await client.push().setPlatform(JPush.ALL)
            .setAudience(JPush.ALL)
            .setMessage(content, title, contentType, extras)
            .send();
        return {success: true, result: result};
    } catch (e) {
        console.error(`SendMessageAll error: ${e.message}`);
        this.ctx.logger.error(`SendMessageAll error: ${e.message}`);
        return {success: false, result: {}};
    }
};


/**
 * 自定义消息  个人
 * @returns {Promise<void>}
 * @constructor
 */
exports.SendMessageByUser = async function ({userId, content, title, contentType, extras}) {
    try {
        let result = await client.push().setPlatform(JPush.ALL)
            .setAudience(JPush.registration_id(userId))
            .setMessage(content, title, contentType, extras)
            .send();
        return {success: true, result: result};
    } catch (e) {
        console.error(`SendMessageByUser error: ${e.message}`);
        this.ctx.logger.error(`SendMessageByUser error: ${e.message}`);
        return {success: false, result: {}};
    }
};
