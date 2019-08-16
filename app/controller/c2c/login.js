const loginRule = require("../rule/c2c/login");
const code = require("../../utils/code");
const aliyunUtil = require('../../utils/aliyun');
const commonUtil = require('../../utils/commonUtil');
const moment = require('moment');
const Controller = require('egg').Controller;
const request = require("request");
const util = require('util');
const qs = require('qs');
const crypto = require("crypto");
let Response = require('./../../utils/resObj');
let jiguangUtil = require('./../../utils/jiguang');
const I18nConst = require('./../../../config/constant/i18n');

class LoginController extends Controller {


    /**
     * 短信登录， 提供对外的接口
     **/
    async SmsLogin() {
        let RuleErrors = this.ctx.Rulevalidate(loginRule.smslogin, this.ctx.request.body);

        // 验证参数
        if (RuleErrors != undefined) {
            let errors = RuleErrors[0];
            return this.ctx.body = {
                code: code.ERROR_PARAMS,
                msg: this.ctx.I18nMsg(I18nConst.VerifyFailed),
                type: "ERROR_PARAMS",
                data: {
                    field: errors.field + " " + errors.message
                }
            }
        }

        let phone = this.ctx.request.body.phone;
        let wcode = this.ctx.request.body.code;
        let smsCode = Number(wcode) || 0;


        let source = this.ctx.request.body.source;
        let from_user = 0;
        if (source === 'web') {
            try {
                let from = this.ctx.request.body.from;
                if (!from) {
                    return this.ctx.body = {
                        code: code.ERROR_PARAMS,
                        msg: 'from empty',
                        type: 'ERROR_PARAMS',
                        data: {
                            field: 'from empty'
                        }
                    }
                }
                from_user = commonUtil.decryptWithAes(from);
            } catch (e) {
                this.ctx.logger.error(`SmsLogin web 数据解密出错:${e.message}`);
                return this.ctx.body = {
                    code: code.ERROR_PARAMS,
                    msg: 'from ilegal',
                    type: 'ERROR_PARAMS',
                    data: {
                        field: this.ctx.I18nMsg(I18nConst.IlegalParameters)
                    }
                }
            }
        }

        if (!smsCode || wcode.length != 6) {
            return this.ctx.body = {
                code: code.ERROR_PARAMS,
                msg: this.ctx.I18nMsg(I18nConst.IlegalParameters),
                type: 'ERROR_PARAMS',
                data: {
                    field: this.ctx.I18nMsg(I18nConst.IlegalParameters)
                }
            }
        }

        let result = await this.valid_send_sms(phone, 1, smsCode);
        if (result.sms_id == undefined) {
            return result;
        }

        let whereObj = {
            phone: phone
        };

        let isnew = false;

        let ui = await this.ctx.service.c2c.userService.getUserInfoByObj(whereObj);
        if (ui == null) {
            isnew = true;
            let phone_area_code = this.ctx.request.body.phoneAreaCode;
            let regist_device_type = this.ctx.request.body.registDeviceType || 'ios';
            if (!phone_area_code) {
                return this.ctx.body = {
                    code: code.ERROR_PARAMS,
                    msg: this.ctx.I18nMsg(I18nConst.IlegalParameters),
                    type: 'ERROR_PARAMS',
                    data: {
                        field: this.ctx.I18nMsg(I18nConst.IlegalParameters)
                    }
                }
            }
            let jsonObj = {
                account: phone,
                password: phone,
                regist_device_type: regist_device_type,
                phone: phone,
                nick_name: this.app.config.nickName,
                sms_id: result.sms_id,
                phone_area_code: phone_area_code
            };
            await this.ctx.service.c2c.userService.register(jsonObj)
        }

        let userInfo = await this.ctx.service.c2c.userService.getUserInfoByObj(whereObj);
        if (userInfo == null) {
            return this.ctx.body = {
                code: code.ERROR_ACCOUNT_PASSWORD,
                msg: this.ctx.I18nMsg(I18nConst.NcorrectAccountOrPassword),
                type: "ERROR_ACCOUNT_PASSWORD",
                data: {
                    field: this.ctx.I18nMsg(I18nConst.NcorrectAccountOrPassword)
                }
            }
        }

        let userId = userInfo.user_id;
        // 返回数据删除password
        delete(userInfo.password);
        // 返回用户信息

        await this.ctx.service.c2c.userService.updateUserErrNum(0, userId); // 更新用户密码错误次数
        await this.ctx.service.c2c.userService.updateUserLoginStatus(userId, 1); // 更新用户登录状态


        let token = this.app.signToken(userId);
        await this.ctx.service.c2c.userTokenService.updateUserTokenByLogin(userId, token);
        let im = await this.ctx.service.tokensky.userService.findOneImUserRegister({
            username: `${userId}`,
            appkey: this.app.config.jiguang.key
        });
        console.log(userId);
        let imUserName = '';
        let imPassword = '';
        if (!im) {
            try {
                await jiguangUtil.ImUserRegister.call(this, `User${userId}`, `User${userId}`);
                await this.ctx.service.tokensky.userService.addImUserRegister({
                    username: userId,
                    password: userId,
                    appkey: this.app.config.jiguang.key
                });
                imUserName = `User${userId}`;
                imPassword = `User${userId}`;
            } catch (e) {
                console.error(`login ImUserRegister error : ${e.message}`);
                this.ctx.logger.error(`login ImUserRegister error : ${e.message}`);
            }
        } else {
            imUserName = `User${userId}`;
            imPassword = `User${userId}`;
        }

        if (isnew && source === 'web') {
            let inviteParams = {
                from: from_user,
                to: userId
            };
            await this.ctx.service.tokensky.userService.addUserInvite(inviteParams);
        }
        return this.ctx.body = {
            code: code.SUCCESS,
            msg: this.ctx.I18nMsg(I18nConst.LoginSuccessfully),
            result: {
                //    userInfo: userInfo,
                token: token,
                imUserName: imUserName,
                imPassword: imPassword
            }
        }
    }


    /**
     * 用户发起认证, [提供对外的接口]
     **/
    async UserSendSms() {
        let RuleErrors = this.ctx.Rulevalidate(loginRule.usersendsms, this.ctx.params)

        // 验证参数
        if (RuleErrors != undefined) {
            let errors = RuleErrors[0]
            return this.ctx.body = {
                code: code.ERROR_PARAMS,
                msg: this.ctx.I18nMsg(I18nConst.VerifyFailed),
                type: "ERROR_PARAMS",
                data: {
                    field: errors.field + " " + errors.message
                }
            }
        }

        let phone = this.ctx.params.phone
        let wcode = this.ctx.params.code
        let smsCode = Number(code) || 0

        if (!smsCode || wcode.length != 6) {
            return this.ctx.body = {
                code: code.ERROR_PARAMS,
                msg: this.ctx.I18nMsg(I18nConst.IlegalParameters),
                type: 'ERROR_PARAMS',
                data: {
                    field: this.ctx.I18nMsg(I18nConst.IlegalParameters)
                }
            }
        }

        return this.valid_send_sms(phone, 0, smsCode);
    }


    /**
     * 短信服务验证功能;
     **/
    async valid_send_sms(phone, type, msgcode) {
        let sms = await this.ctx.service.c2c.userService.getNewestSmsInfoByPhone(phone, type);
        if (sms == null) {
            return this.ctx.body = {
                code: code.ERROR_USER_NOTFOUND,
                msg: this.ctx.I18nMsg(I18nConst.PhoneAuthentication),
                type: "ERROR_USER_NOTFOUND",
                data: {
                    field: this.ctx.I18nMsg(I18nConst.PhoneAuthentication)
                }
            }
        }

        let timestamp = sms.update_time;
        let result = this.app.checkCaptchaCode(timestamp);
        if (!result) {
            return this.ctx.body = {
                code: code.ERROR_VALIDATE_OVERTIEM,
                msg: this.ctx.I18nMsg(I18nConst.VerificationCodeInvalid),
                type: "ERROR_VALIDATE_OVERTIEM",
                data: {
                    field: this.ctx.I18nMsg(I18nConst.VerificationCodeInvalid)
                }
            }
        }

        if (msgcode == sms.code) {
            let updateObj = {
                user_status: 1
            }
            let whereObj = {
                sms_id: sms.sms_id
            }
            let addStatus = await this.ctx.service.c2c.userService.updateSmsInfoMessage(updateObj, whereObj);
            if (!addStatus) {
                return this.ctx.body = {
                    code: code.ERROR_UPDATE_DATA,
                    msg: this.ctx.I18nMsg(I18nConst.UpdateDataFailed),
                    type: "ERROR_UPDATE_DATA",
                    data: {
                        field: this.ctx.I18nMsg(I18nConst.UpdateDataFailed)
                    }
                }
            }
        }
        else {
            return this.ctx.body = {
                code: code.ERROR_VALID_CODE,
                msg: this.ctx.I18nMsg(I18nConst.IncorrectVerificationCode),
                type: "ERROR_VALID_CODE",
                data: {
                    field: this.ctx.I18nMsg(I18nConst.IncorrectVerificationCode)
                }
            }
        }
        return sms;
    }


    async getSmsCode() {
        let RuleErrors = this.ctx.Rulevalidate(loginRule.getsmscode, this.ctx.request.body)

        // 验证参数
        if (RuleErrors != undefined) {
            let errors = RuleErrors[0]
            return this.ctx.body = {
                code: code.ERROR_PARAMS,
                msg: this.ctx.I18nMsg(I18nConst.VerifyFailed),
                type: "ERROR_PARAMS",
                data: {
                    field: errors.field + " " + errors.message
                }
            }
        }

        let smsType = Number(this.ctx.request.body.type) || 0
        if (smsType != 0 && smsType != 1 && smsType != 2) {
            return this.ctx.body = {
                code: code.ERROR_PARAMS,
                msg: this.ctx.I18nMsg(I18nConst.IllegalType),
                type: 'ERROR_PARAMS',
                data: {
                    field: this.ctx.I18nMsg(I18nConst.IllegalType)
                }
            }
        }

        let phoneNmber = this.ctx.request.body.phoneNumber || ''
        let phoneAreaCode = this.ctx.request.body.phoneAreaCode;


        let duid = this.ctx.request.body.duid;
        let pcode = this.ctx.request.body.pcode;


        try {
            let ret = await this.valid_pic_code(duid, smsType, pcode);
            if (code.SUCCESS != ret) {
                this.ctx.logger.error(`Avatar getSmsCode error: 图片验证码错误  duid=${duid},smsType=${smsType},pcode=${pcode}`);
                return this.ctx.body = {
                    code: ret,
                    msg: this.ctx.I18nMsg(I18nConst.IncorrectGraphicVerificationCode),
                    data: {
                        field: this.ctx.I18nMsg(I18nConst.IncorrectGraphicVerificationCode)
                    }
                }
            }

            // 用户短信注册时获取验证码， 如果用户注册过，提示直接登录;
            // 用户短信登录时获取验证码， 如果用户没有注册信息，仍然可以获取到验证码;
            // 用户重设密码时， 如果用户没有注册细细你，提示出错
            // 去用户信息表中进行查看

            let uInfo = await this.ctx.service.c2c.userService.getUserInfoByPhone(phoneNmber);
            let userID = 0;
            if (uInfo) {
                phoneAreaCode = uInfo.phone_area_code;
                userID = uInfo.user_id;
            }
            if (phoneAreaCode == '86' && !(/^1[345789]\d{9}$/.test(phoneNmber))) {
                this.ctx.logger.error(`Avatar getSmsCode error: 手机号码不合法  phone=${phoneNmber}`);
                return this.ctx.body = {
                    code: code.ERROR_PARAMS,
                    msg: this.ctx.I18nMsg(I18nConst.IllegalPhoneNumber),
                    type: 'ERROR_PARAMS',
                    data: {
                        field: this.ctx.I18nMsg(I18nConst.IllegalPhoneNumber)
                    }
                }
            }
            if (smsType == 1) {
                if (uInfo == null) {
                }
            } /*else if (smsType == 2) {
                if (uInfo == null || uInfo.status != 0 || uInfo.u_status != 1) {
                    return this.ctx.body = {
                        code: code.ERROR_USER_NOTFOUND,
                        msg: "没有检测到手机注册信息",
                        type: "ERROR_USER_NOTFOUND",
                        data: {
                            field: "没有检测到手机注册信息"
                        }
                    }
                } else {
                    userID = uInfo.user_id;
                }
            } */ else if (smsType == 0) {
                if (uInfo != null && uInfo.status == 0 && uInfo.u_status == 1) {
                    this.ctx.logger.error(`Avatar getSmsCode error: 该手机已经注册过  phone=${phoneNmber}`);
                    return this.ctx.body = {
                        code: code.ERROR_USER_NOTFOUND,
                        msg: this.ctx.I18nMsg(I18nConst.PhoneAlreadyRegistered),
                        type: "ERROR_USER_NOTFOUND",
                        data: {
                            field: this.ctx.I18nMsg(I18nConst.PhoneAlreadyRegistered)
                        }
                    }
                }
            }
            // 在发送之前需要检测上次获取验证码的时间
            let s = await this.ctx.service.c2c.userService.getNewestSmsInfoByPhone(phoneNmber, smsType);
            if (s != null && s.update_time != undefined) {
                let current = moment(Date.now()).format('X');
                if (current - s.update_time < this.config.smsInterval) {
                    this.ctx.logger.error(`Avatar getSmsCode error: 请求验证码时间太快  phone=${phoneNmber},smsType=${smsType}`);
                    return this.ctx.body = {
                        code: code.ERROR_VALIDATE_OVERTIEM,
                        msg: this.ctx.I18nMsg(I18nConst.WaitVerificationCode),
                        type: 'ERROR_VALIDATE_OVERTIEM',
                        data: {
                            field: this.ctx.I18nMsg(I18nConst.WaitVerificationCode)
                        }
                    }
                }
            }

            // 向阿里云发送短信服务
            let sendPhone = phoneNmber;
            if (phoneAreaCode && phoneAreaCode != '86') {
                sendPhone = phoneAreaCode + phoneNmber;
            }
            let sms_result = await this.send_temp_sms(sendPhone, smsType, phoneAreaCode);
            if (sms_result.result.Code != 'OK') {
                this.ctx.logger.error(`Avatar getSmsCode error: 调用信息服务错误  phone=${sendPhone},smsType=${smsType}`);
                return this.ctx.body = {
                    code: code.ERROR_JIGUANG_EXCEPTION,
                    msg: this.ctx.I18nMsg(I18nConst.FrequentOperation),
                    type: 'ERROR_JIGUANG_EXCEPTION',
                    data: {
                        field: this.ctx.I18nMsg(I18nConst.FrequentOperation)
                    }
                }
            }

            let current = moment(Date.now()).format('X')
            let codemsg = sms_result.code;
            let insertObj = {
                phone: phoneNmber,
                code: codemsg,
                status: smsType,
                user_status: 0,
                update_time: current,
                user_id: userID
            };

            let addStatus = await this.ctx.service.c2c.userService.addSmsInfoMessage(insertObj);
            if (!addStatus) {
                return this.ctx.body = {
                    code: code.ERROR_UPDATE_DATA,
                    msg: this.ctx.I18nMsg(I18nConst.UpdateDataFailed),
                    type: "ERROR_UPDATE_DATA",
                    data: {
                        field: this.ctx.I18nMsg(I18nConst.UpdateDataFailed)
                    }
                }
            }

            return this.ctx.body = {
                code: code.SUCCESS,
                msg: this.ctx.I18nMsg(I18nConst.RequestVerificationCodeSuccessfully)
            }
        } catch (error) {
            return this.ctx.body = {
                code: code.ERROR_SYSTEM,
                type: 'ERROR_SYSTEM',
                msg: this.ctx.I18nMsg(I18nConst.SystemError) + error,
                data: {
                    field: this.ctx.I18nMsg(I18nConst.SystemError) + error
                }
            }
        }
    }


    /**
     * 检查图片验证码
     **/
    async valid_pic_code(duid, type, pcode) {
        let cInfo = await this.ctx.service.c2c.userService.getNewestPicInfoByDuid(duid, type);
        if (!cInfo) {
            return code.ERROR_CHECK_NOTFOUND;
        }
        let ccode = cInfo.check_code;
        if (ccode != pcode) {
            return code.ERROR_VALID_PIC_CODE;
        }
        return code.SUCCESS;
    }


    /**
     *  发起短信认证模板服务 [验证码]
     **/
    async send_temp_sms(phone, smsType, phoneAreaCode) {
        const config = this.app.config.aliYun;
        /*        const temp_uri = this.app.config.sms_send_temp;
                let valid_code = this.app.randomCode();
                console.log("valid_code ", valid_code);
                let temp_id = 0;
                if (smsType == 0 || smsType == 2) {
                    temp_id = config.temp_para_id;
                }
                else if (smsType == 1) {
                    temp_id = config.temp_para_login;
                }
                let params = {
                    "mobile": phone,
                    "sign_id": config.sign_id,
                    "temp_id": temp_id,
                    "temp_para": {"code": valid_code}
                };
                let result = await this.makeRequest(temp_uri, params)
                console.log("result ", result)
                return {result: result, code: valid_code}*/
        let valid_code = this.app.randomCode();
        let params = {
            phoneAreaCode: phoneAreaCode,
            smsType: smsType,
            phone: phone,
            templateParam: {
                "code": valid_code
            }
        };
        let result = await aliyunUtil.SendSms.call(this, params);
        return {result: result, code: valid_code}

    }


    /**
     *  短信服务请求
     *  @uri sms 短信服务的api
     *  @params api 对应的参数 json object
     */
    makeRequest(uri, params) {
        let data = params;
        const config = this.app.config.jiguang;
        return new Promise(function (resolve, reject) {
            request.post(uri, {
                headers: {
                    Authorization: 'Basic '
                    + new Buffer(util.format('%s:%s', config.key, config.secret)).toString('base64'),
                    'Content-Type': 'application/json'
                },
                body: data,
                timeout: 10000,
                json: true

            }, function (err, response, body) {
                if (err) {
                    return reject(err)
                }
                if (!body) {
                    return reject(new Error(response.statusMessage))
                }
                if (body.error) {
                    return reject(new Error(body.error.message))
                }
                return resolve(body)
            })
        })
    }

    // 退出登录LoginOut
    async loginOut() {
        // 获取头部数据
        let json = await this.ctx.checkToken();
        let userId = json.uid;
        try {
            // 更新用户token和用户登录状态
            let userLoginStatus = await this.ctx.service.c2c.userService.updateUserLoginStatus(userId, 0)
            let userTokenStatus = await this.ctx.service.c2c.userTokenService.updateUserTokenByLoginOut(userId)
            if (userLoginStatus && userTokenStatus) {
                return this.ctx.body = {
                    code: code.SUCCESS,
                    msg: this.ctx.I18nMsg(I18nConst.LogoutSuccessfully)
                }
            } else {
                this.ctx.logger.error(`Avatar loginOut error: userId=${userId},退出登录失败`);
                return this.ctx.body = {
                    code: code.ERROR_UPDATE_DATA,
                    type: 'ERROR_UPDATE_DATA',
                    msg: this.ctx.I18nMsg(I18nConst.LogoutFailed),
                    data: {
                        field: this.ctx.I18nMsg(I18nConst.LogoutFailed)
                    }
                }
            }
        } catch (error) {
            this.ctx.logger.error(`Avatar loginOut error: userId=${userId}, ${error.message}`);
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


    async verify() {
        let RuleErrors = this.ctx.Rulevalidate(loginRule.checkverify, this.ctx.params)

        // 验证参数
        if (RuleErrors != undefined) {
            let errors = RuleErrors[0]
            return this.ctx.body = {
                code: code.ERROR_PARAMS,
                msg: this.ctx.I18nMsg(I18nConst.VerifyFailed),
                type: "ERROR_PARAMS",
                data: {
                    field: errors.field + " " + errors.message
                }
            }
        }

        let duid = this.ctx.params.duid;
        let type = this.ctx.params.type;
        let nType = Number(type);
        if (nType != 0 && nType != 1 && nType != 2) {
            return this.ctx.body = {
                code: code.ERROR_PARAMS,
                msg: this.ctx.I18nMsg(I18nConst.IllegalType),
                type: 'ERROR_PARAMS',
                data: {
                    field: this.ctx.I18nMsg(I18nConst.IllegalType)
                }
            }
        }

        // let captcha = await this.service.bibei.toolsService.captcha(); // 服务里面的方法
        // let text = captcha.text.toLowerCase();
        let data = await this.service.tokensky.toolsService.getIcode();
        let text = data.code;

        let current = moment(Date.now()).format('X');
        let insertObj = {
            device_id: duid,
            check_code: text,
            status: type,
            update_time: current
        }
        let addStatus = await this.ctx.service.c2c.userService.addCheckCodeInfo(insertObj);
        if (!addStatus) {
            return this.ctx.body = {
                code: code.ERROR_UPDATE_DATA,
                msg: this.ctx.I18nMsg(I18nConst.UpdateDataFailed),
                type: "ERROR_UPDATE_DATA",
                data: {
                    field: this.ctx.I18nMsg(I18nConst.UpdateDataFailed)
                }
            }
        }

        return this.ctx.body = {
            code: code.SUCCESS,
            msg: this.ctx.I18nMsg(I18nConst.SendSuccessfully),
            result: {
                img: data.img
            }
        }
    }


    async ResetPassword() {
        let response = Response();
        let RuleErrors = this.ctx.Rulevalidate(loginRule.resetpasswrod, this.ctx.request.body)

        // 验证参数
        if (RuleErrors != undefined) {
            let errors = RuleErrors[0];
            response.errMsg(this.ctx.I18nMsg(I18nConst.VerifyFailed) + errors.field + errors.message, code.ERROR_PARAMS, 'ERROR_PARAMS');
            return this.ctx.body = response;
        }

        let phone = this.ctx.request.body.phone;
        let wcode = this.ctx.request.body.code;
        let password = this.ctx.request.body.password;
        let smsCode = Number(wcode) || 0;

        if (!smsCode || wcode.length != 6) {
            response.errMsg(this.ctx.I18nMsg(I18nConst.IlegalParameters), code.ERROR_PARAMS, 'ERROR_PARAMS');
            return this.ctx.body = response;
        }

        let result = await this.valid_send_sms(phone, 2, smsCode);
        if (result.sms_id == undefined) {
            return result;
        }

        let whereObj = {
            user_id: result.user_id
        };
        let userInfo = await this.ctx.service.c2c.userService.getUserInfoByObj(whereObj);
        if (userInfo == null) {
            response.errMsg(this.ctx.I18nMsg(I18nConst.NcorrectAccountOrPassword), code.ERROR_ACCOUNT_PASSWORD, 'ERROR_ACCOUNT_PASSWORD');
            return this.ctx.body = response;
        }

        let salt = userInfo.salt;
        let new_pass = password + salt;
        let md5 = crypto.createHash("md5");
        let pass_key = md5.update(new_pass).digest("hex");

        let updateObj = {
            password: pass_key
        };

        let updateStatus = await this.ctx.service.c2c.userService.modifyUserInfo(updateObj, whereObj);
        if (!updateStatus) {
            response.errMsg(this.ctx.I18nMsg(I18nConst.PasswordChangeFailed), code.ERROR_UPDATE_DATA, 'ERROR_UPDATE_DATA');
            return this.ctx.body = response;
        }

        return this.ctx.body = response;
    }


}


module.exports = LoginController;
