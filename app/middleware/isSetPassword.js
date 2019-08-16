const _ = require('lodash');
let Response = require('./../utils/resObj');
let code = require('./../utils/code');
const I18nConst = require("../../config/constant/i18n");
module.exports = options => {
    return async function isSetPassword(ctx, next) {
        let response = Response();
        let tokenVisable = await ctx.checkTokenVisiable();
        if (!tokenVisable) {
            return ctx.body = {
                code: code.ERROR_TOKEN_OVERDUE,
                type: "ERROR_TOKEN_OVERDUE",
                msg: this.ctx.I18nMsg(I18nConst.TokenFailed)
            }
        }
        let json = await ctx.checkToken();
        let uid;
        if (json !== false) {
            uid = json.uid;
        }
        const userInfo = await ctx.service.c2c.userService.getUserByUid(uid);
        if (_.isEmpty(userInfo)) {
            response.errMsg(this.ctx.I18nMsg(I18nConst.UserDoesNotExist), code.ERROR_USER_NOTFOUND, 'ERROR_USER_NOTFOUND');
            return ctx.body = response;
        }
        if (!userInfo.transaction_password) {
            response.errMsg(this.ctx.I18nMsg(I18nConst.PleaseSetTransactionPassword), code.ERROR_SET_PWD, 'ERROR_SET_PWD');
            return ctx.body = response;
        }
        await next();
    }
};
