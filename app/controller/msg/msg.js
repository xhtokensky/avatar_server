'use strict';

const Controller = require('egg').Controller;

const code = require("../../utils/code");

let Response = require('../../utils/resObj');

let dateUtil = require('../../utils/dateUtil');

let jiguangUtil = require('../../utils/jiguang');

let jpushConst = require('../../../config/constant/jpush');

const I18nConst = require('../../../config/constant/i18n');

class MsgController extends Controller {

    async getMessageList() {

        let json = await this.ctx.checkToken();
        let userId = json.uid;

        let pageNum = Number(this.ctx.params.pageNum) || 1;
        let pageSize = Number(this.ctx.params.pageSize) || 10;
        let startNum = (pageNum - 1) * pageSize;

        try {
            let result = await this.ctx.service.tokensky.msgService.getSysMessageList(userId, pageSize, startNum);
            for (let i = 0; i < result.length; i++) {
                result[i].create_time = result[i].create_time ? new Date(result[i].create_time).getTime() : 0
            }
            let totalNum = await this.ctx.service.tokensky.msgService.getSysMessageTotalNum(userId);

            let totalPage;
            if (totalNum > 0) {
                totalPage = Math.ceil(totalNum / pageSize);
            } else {
                totalPage = 0;
            }

            return this.ctx.body = {
                code: code.SUCCESS,
                msg: this.ctx.I18nMsg(I18nConst.SendSuccessfully),
                result: {
                    messageList: result,
                    currentPage: pageNum,
                    totalPage: totalPage
                }
            }
        }
        catch (error) {
            this.ctx.logger.error('Avatar getMessageList error:', error.message);
            return this.ctx.body = {
                code: code.ERROR_SYSTEM,
                type: 'ERROR_SYSTEM',
                msg: this.ctx.I18nMsg(I18nConst.SystemError),
                data: {
                    field: this.ctx.I18nMsg(I18nConst.SystemError) + error
                }
            }
        }
    }

    async getNewMessage() {
        let response = Response();
        try {
            let result = await this.ctx.service.tokensky.msgService.getNewMessage();
            response.content.data = result;
            return this.ctx.body = response;
        } catch (e) {
            this.ctx.logger.error('Avatar getNewMessage error:', e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }

    async readMessage() {
        let response = Response();
        try {
            let json = await this.ctx.checkToken();
            let userId = json.uid;
            let {ctx} = this;
            let body = ctx.request.body;
            if (!body.messageId) {
                response.errMsg(this.ctx.I18nMsg(I18nConst.VerifyFailed) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
                return this.ctx.body = response;
            }
            let messageId = body.messageId;
            let message = await ctx.service.tokensky.msgService.findOneMessage({message_id: messageId, is_read: 0});
            let sendJpush = false;
            if (message) {
                let type = message.type;
                let jiguangReg = await ctx.service.tokensky.userService.findOneJiguangRegistrationid({user_id: userId});
                if (type == 0) {
                    let msgRecord = await ctx.service.tokensky.msgService.findOneMessageRecord({
                        message_id: messageId,
                        user_id: userId
                    });
                    if (!msgRecord) {
                        let as = await ctx.service.tokensky.msgService.addMessageRecord({
                            message_id: messageId,
                        });
                        if (!as) {
                            this.ctx.logger.error('readMessage error:', e.message);
                            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
                            return this.ctx.body = response;
                        }
                        sendJpush = true;
                    }
                } else {
                    let us = await ctx.service.tokensky.msgService.updateMessage({
                        is_read: 1,
                        read_time: dateUtil.currentDate()
                    }, {message_id: messageId});
                    if (!us) {
                        this.ctx.logger.error('readMessage error:', e.message);
                        response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
                        return this.ctx.body = response;
                    }
                    sendJpush = true;
                }
                //推送
                if (jiguangReg && sendJpush) {
                    let registration_id = jiguangReg.registration_id;
                    jiguangUtil.SendMessageByUser.call(this, {
                        content: 'red port',
                        title: 'red port',
                        userId: registration_id,
                        extras: {
                            category: jpushConst.jpushType.MSG_RED_PORT,
                            num: -1
                        }
                    })
                }
            }
            return ctx.body = response;
        } catch (e) {
            this.ctx.logger.error('readMessage error:', e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }


    async getRedPort() {
        let response = Response();
        let {ctx} = this;
        try {
            let json = await this.ctx.checkToken();
            let userId = json.uid;
            let count = await ctx.service.tokensky.msgService.getRedPort(userId);
            response.content.count = count;
            return ctx.body = response;
        } catch (e) {
            this.ctx.logger.error('getRedPort error:', e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }

}

module.exports = MsgController;
