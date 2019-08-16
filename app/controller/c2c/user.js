'use strict';

const Controller = require('egg').Controller;
const userRule = require("../rule/c2c/user");
const code = require("../../utils/code");
let Response = require('./../../utils/resObj');
let qiniuUtil = require('./../../utils/qiniu');
let commonUtil = require('./../../utils/commonUtil');
let aliyunUtil = require('./../../utils/aliyun');
const I18nConst = require('./../../../config/constant/i18n');
const WAValidator = require('wallet-address-validator');
let _ = require('lodash');

class UserController extends Controller {

    // 更新用户基本信息 昵称、性别、email、
    async modifyUserInfo() {
        let RuleErrors = this.ctx.Rulevalidate(userRule.modifyUserInfo, this.ctx.request.body)

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

        // 获取数据
        let nickName = this.ctx.request.body.nickName;

        nickName = _.trim(nickName);

        if (nickName.length > 12) {
            return this.ctx.body = {
                code: code.ERROR_NICKNAME_LONG,
                type: "ERROR_NICKNAME_LONG",
                msg: this.ctx.I18nMsg(I18nConst.Nickname),
                data: {
                    field: this.ctx.I18nMsg(I18nConst.Nickname)
                }
            }
        }

        let json = await this.ctx.checkToken();
        let userId = json.uid;

        try {

            let isUpdateNickName = await this.ctx.service.c2c.userService.isUpdateNickName({
                userId: userId,
                nickName: nickName
            });
            if (!isUpdateNickName) {
                return this.ctx.body = {
                    code: code.ERROR_PARAMS,
                    type: "ERROR_PARAMS",
                    msg: this.ctx.I18nMsg(I18nConst.NicknameAlready),
                    data: {
                        field: this.ctx.I18nMsg(I18nConst.NicknameAlready)
                    }
                }
            }

            // 开始更新用户数据
            let updateStatus = await this.ctx.service.c2c.userService.updateUserInfo({nick_name: nickName}, {user_id: userId})
            if (updateStatus) {
                return this.ctx.body = {
                    code: code.SUCCESS,
                    msg: this.ctx.I18nMsg(I18nConst.UpdateInformationSuccessfully)
                }
            }

            return this.ctx.body = {
                code: code.ERROR_UPDATE_DATA,
                type: "ERROR_UPDATE_DATA",
                msg: this.ctx.I18nMsg(I18nConst.UpdateDataFailed),
                data: {
                    field: this.ctx.I18nMsg(I18nConst.UpdateDataFailed)
                }
            }
        } catch (error) {
            this.ctx.logger.error(`Avatar modifyUserInfo error: ${error.message}`);
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

    // 获取用户信息
    async getUserInfo() {
        let json = await this.ctx.checkToken();
        let userId = json.uid;

        let whereObj = {
            user_id: userId
        };

        try {
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

            {
                delete userInfo.sms_id;
                delete userInfo.password;
                delete userInfo.user_status;
                delete userInfo.is_lock;
                delete userInfo.is_login;
                delete userInfo.pwd_error_number;
                delete userInfo.creator_id;
                delete userInfo.create_time;
                delete userInfo.create_ip;
                delete userInfo.updater_id;
                delete userInfo.update_time;
                delete userInfo.update_ip;
                delete userInfo.salt;
            }
            userInfo.head_img = qiniuUtil.getSignAfterUrl(userInfo.head_img, this.app.config.qiniuConfig);
            return this.ctx.body = {
                code: code.SUCCESS,
                msg: this.ctx.I18nMsg(I18nConst.GetInformationSuccessfully),
                result: {
                    userInfo: userInfo
                }
            }

        } catch (error) {
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


    async saveAddressBook() {
        let json = await this.ctx.checkToken();
        let userId = json.uid;
        let body = this.ctx.request.body;
        body.userId = userId;
        let RuleErrors = this.ctx.Rulevalidate(userRule.saveAddressBook, body);


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


        try {
            let address_id = body.addressId;
            let params = {
                user_id: body.userId,
                receipt_address: body.receiptAddress,
                wallet_type_id: body.walletTypeId,
                wallet_type_name: body.walletTypeName,
                address_name: body.addressName,
                address_id: address_id
            };
            let valid = WAValidator.validate(body.receiptAddress, body.walletTypeName, 'both');
            if (!valid) {
                return this.ctx.body = {
                    code: code.ERROR_PARAMS,
                    type: "ERROR_PARAMS",
                    msg: this.ctx.I18nMsg(I18nConst.IllegalAddress),
                    data: {
                        field: this.ctx.I18nMsg(I18nConst.IllegalAddress)
                    }
                }
            }

            let r = await this.ctx.service.c2c.addressBookService.addAddressBook(params);
            if (r) {
                return this.ctx.body = {
                    code: code.SUCCESS,
                    msg: this.ctx.I18nMsg(I18nConst.AddSuccessfully)
                }
            }

            return this.ctx.body = {
                code: code.ERROR_ADD_DATA,
                type: "ERROR_ADD_DATA",
                msg: this.ctx.I18nMsg(I18nConst.AddFailed),
                data: {
                    field: this.ctx.I18nMsg(I18nConst.AddFailed)
                }
            }
        } catch (e) {
            this.ctx.logger.error(`Avatar saveAddressBook error: ${e.message}`);
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


    async getAddressBook() {
        let json = await this.ctx.checkToken();
        let userId = json.uid;
        try {
            let receiptAddress = this.ctx.query.receiptAddress;
            let list = await this.ctx.service.c2c.addressBookService.getAddressBookByUserId(userId, receiptAddress);
            for (let i = 0; i < list.length; i++) {
                let obj = await this.ctx.service.tokensky.userService.findOneUserBalanceCoin(list[i].wallet_type_name);
                let avatar = obj ? obj.avatar : '';
                list[i].avatar = qiniuUtil.getSignAfterUrl(avatar, this.app.config.qiniuConfig);
            }
            return this.ctx.body = {
                code: code.SUCCESS,
                msg: this.ctx.I18nMsg(I18nConst.SendSuccessfully),
                result: list
            }
        } catch (e) {
            this.ctx.logger.error(`Avatar getAddressBook error: ${e.message}`);
            return this.ctx.body = {
                code: code.ERROR_SYSTEM,
                type: 'ERROR_SYSTEM',
                msg: this.ctx.I18nMsg(I18nConst.SystemError),
                data: {
                    field: this.ctx.I18nMsg(I18nConst.SystemError) + e
                }
            }
        }
    }


    async delAddressBook() {
        let response = Response();
        try {
            let body = this.ctx.request.body;
            let RuleErrors = this.ctx.Rulevalidate(userRule.delAddressBook, body);
            // 验证参数
            if (RuleErrors != undefined) {
                let errors = RuleErrors[0];
                response.errMsg(`${this.ctx.I18nMsg(I18nConst.VerifyFailed)}: ${errors.field} ${errors.message}`, code.ERROR_PARAMS, 'ERROR_PARAMS');
                return this.ctx.body = response;
            }
            let addressId = body.addressId;
            let r = await this.ctx.service.c2c.addressBookService.deleteAddressBook(addressId);
            if (!r) {
                response.errMsg(this.ctx.I18nMsg(I18nConst.VerifyFailed), code.ERROR_SYSTEM, 'ERROR_SYSTEM');
                return this.ctx.body = response;
            }
            return this.ctx.body = response;
        } catch (e) {
            this.ctx.logger.error(`Avatar delAddressBook error: ${e.message}`);
            response.errMsg(this.ctx.I18nMsg(I18nConst.VerifyFailed), code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }


    async checkVersion() {
        let RuleErrors = this.ctx.Rulevalidate(userRule.checkVersion, this.ctx.params)

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
        const V = 3.0;
        let version = this.ctx.params.version;
        if (V > version) {
            return this.ctx.body = {
                code: code.SUCCESS,
                msg: this.ctx.I18nMsg(I18nConst.CheckVersionSuccessfully),
                result: {
                    url: "这是检查版本的连接"
                }
            }
        } else {
            return this.ctx.body = {
                code: code.SUCCESS,
                msg: this.ctx.I18nMsg(I18nConst.AlreadyNewestVersion),
                result: {
                    url: ""
                }
            }
        }
    }


    async realAuth() {
        let json = await this.ctx.checkToken();
        let userId = json.uid;
        let response = Response();
        try {

            let step = this.ctx.params.step;
            if (step != 1 && step != 2 && step != 3) {
                response.errMsg(this.ctx.I18nMsg(I18nConst.IllegalType), code.ERROR_PARAMS, 'ERROR_PARAMS');
                return this.ctx.body = response;
            }

            let body = this.ctx.request.body;

            let realAuth = await this.ctx.service.c2c.userService.findOneRealAuth({user_id: userId});
            if (step == 1) {
                let name = body.name;
                let identityCard = body.identityCard;
                let RuleErrors = this.ctx.Rulevalidate(userRule.realAuth1, body);
                // 验证参数
                if (RuleErrors != undefined) {
                    let errors = RuleErrors[0];
                    response.errMsg(this.ctx.I18nMsg(I18nConst.VerifyFailed) + errors.field + " " + errors.message, code.ERROR_PARAMS, 'ERROR_PARAMS');
                    return this.ctx.body = response;
                }
                let robj = await this.ctx.service.c2c.userService.findOneRealAuth({identity_card: identityCard});
                if (robj) {
                    response.errMsg(this.ctx.I18nMsg(I18nConst.IdCardUsed), code.ERROR_PARAMS, 'ERROR_PARAMS');
                    return this.ctx.body = response;
                }
                if (realAuth && realAuth.name && realAuth.identity_card) {
                    response.errMsg(this.ctx.I18nMsg(I18nConst.Verified), code.ERROR_PARAMS, 'ERROR_PARAMS');
                    return this.ctx.body = response;
                }
                await aliyunUtil.ocrAuth.call(this, identityCard, name);
                if (!realAuth) {
                    let params = {
                        user_id: userId,
                        name: name,
                        status: 1,
                        identity_card: identityCard
                    };
                    let addStatus = await this.ctx.service.c2c.userService.addRealAuth(params);
                    if (!addStatus) {
                        response.errMsg(this.ctx.I18nMsg(I18nConst.AddFailed), code.ERROR_ADD_DATA, 'ERROR_ADD_DATA');
                        return this.ctx.body = response;
                    }
                } else {
                    let params = {
                        name: name,
                        identity_card: identityCard
                    };
                    let condition = {
                        user_id: userId
                    };
                    let updateStatus = await this.ctx.service.c2c.userService.updateRealAuth(params, condition);
                    if (!updateStatus) {
                        response.errMsg(this.ctx.I18nMsg(I18nConst.UploadFailed), code.ERROR_ADD_DATA, 'ERROR_ADD_DATA');
                        return this.ctx.body = response;
                    }
                }
                return this.ctx.body = response
            } else if (step == 2) {

                if (!realAuth || !realAuth.name || !realAuth.identity_card) {
                    response.errMsg(this.ctx.I18nMsg(I18nConst.Verify), code.ERROR_PARAMS, 'ERROR_PARAMS');
                    return this.ctx.body = response;
                }
                if (realAuth.identity_card_picture && realAuth.identity_card_picture2) {
                    response.errMsg(this.ctx.I18nMsg(I18nConst.Verified), code.ERROR_PARAMS, 'ERROR_PARAMS');
                    return this.ctx.body = response;
                }
                let RuleErrors = this.ctx.Rulevalidate(userRule.realAuth2, body);
                // 验证参数
                if (RuleErrors != undefined) {
                    let errors = RuleErrors[0];
                    response.errMsg(this.ctx.I18nMsg(I18nConst.VerifyFailed) + errors.field + " " + errors.message, code.ERROR_PARAMS, 'ERROR_PARAMS');
                    return this.ctx.body = response;
                }
                let identityCardPicture = body.identityCardPicture;
                let identityCardPicture2 = body.identityCardPicture2;
                let identityCardPictureUrl = qiniuUtil.getSignAfterUrl(identityCardPicture, this.app.config.qiniuConfig);
                let identityCardPicture2Url = qiniuUtil.getSignAfterUrl(identityCardPicture2, this.app.config.qiniuConfig);

                let frontBody = await aliyunUtil.ocrDiscern.call(this, identityCardPictureUrl, 'front');
                if (!frontBody.success) {
                    this.ctx.logger.error('front > 身份证识别失败', frontBody);
                    response.errMsg(frontBody.msg, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
                    return this.ctx.body = response;
                }
                let frontObject = frontBody.data;
                let name = frontObject['姓名'];
                let idcard = frontObject['公民身份号码'];
                if (!name || !idcard) {
                    this.ctx.logger.error('front > 身份证识别失败 no name or idcard', frontObject);
                    response.errMsg(this.ctx.I18nMsg(I18nConst.FrequentOperation), code.ERROR_SYSTEM, 'ERROR_SYSTEM');
                    return this.ctx.body = response;
                }

                if (realAuth.name != name || realAuth.identity_card != idcard) {
                    response.errMsg(`${this.ctx.I18nMsg(I18nConst.IdentityInconsistency)}: ${realAuth.name} `, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
                    return this.ctx.body = response;
                }
                await aliyunUtil.ocrAuth.call(this, idcard, name);

                //await this.ctx.sleep(1000 * 2);

                let backBody = await aliyunUtil.ocrDiscern.call(this, identityCardPicture2Url, 'back');

                if (!backBody.success) {
                    this.ctx.logger.error('back > 身份证识别失败', backBody);
                    response.errMsg(backBody.msg, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
                    return this.ctx.body = response;
                }

                let backObject = backBody.data;

                let realAuthStep2Params = {
                    identity_card_picture: identityCardPicture,
                    identity_card_picture2: identityCardPicture2,
                    user_id: userId,
                    name: name,
                    nation: frontObject['民族'],
                    address: frontObject['住址'],
                    identity_card: idcard,
                    birthday: frontObject['出生'],
                    sex: frontObject['性别'],
                    expiry_date: backObject['失效日期'],
                    issuing_authority: backObject['签发机关'],
                    issuing_date: backObject['签发日期']
                };

                let realAuthStep2Status = await this.ctx.service.c2c.userService.realAuthStep2(realAuthStep2Params);

                if (!realAuthStep2Status) {
                    response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError), code.ERROR_SYSTEM, 'ERROR_SYSTEM');
                    return this.ctx.body = response;
                }

                return this.ctx.body = response;
            } else {
                if (!realAuth || !realAuth.name || !realAuth.identity_card) {
                    response.errMsg(this.ctx.I18nMsg(I18nConst.Verify), code.ERROR_PARAMS, 'ERROR_PARAMS');
                    return this.ctx.body = response;
                }
                if (!realAuth.identity_card_picture || !realAuth.identity_card_picture2) {
                    response.errMsg(this.ctx.I18nMsg(I18nConst.Verify), code.ERROR_PARAMS, 'ERROR_PARAMS');
                    return this.ctx.body = response;
                }

                if (realAuth.person_picture) {
                    response.errMsg(this.ctx.I18nMsg(I18nConst.Verified), code.ERROR_PARAMS, 'ERROR_PARAMS');
                    return this.ctx.body = response;
                }

                let RuleErrors = this.ctx.Rulevalidate(userRule.realAuth3, body);
                // 验证参数
                if (RuleErrors != undefined) {
                    let errors = RuleErrors[0];
                    response.errMsg(this.ctx.I18nMsg(I18nConst.VerifyFailed) + errors.field + " " + errors.message, code.ERROR_PARAMS, 'ERROR_PARAMS');
                    return this.ctx.body = response;
                }

                let personPicture = body.personPicture;

                let personPictureUrl = qiniuUtil.getSignAfterUrl(personPicture, this.app.config.qiniuConfig);

                let identity_card_picture = realAuth.identity_card_picture;

                let identityCardPictureUrl = qiniuUtil.getSignAfterUrl(identity_card_picture, this.app.config.qiniuConfig);

                let faceObject = await aliyunUtil.ocrFace.call(this, personPictureUrl, identityCardPictureUrl);

                if (!faceObject) {
                    this.ctx.logger.error(`人脸识别失败`);
                    response.errMsg(this.ctx.I18nMsg(I18nConst.FrequentOperation), code.ERROR_SYSTEM, 'ERROR_SYSTEM');
                    return this.ctx.body = response;
                }

                let confidence = faceObject.confidence;
                if (confidence < 67) {
                    this.ctx.logger.error(`ocrFace confidence:${confidence};userId:${userId}`);
                    response.errMsg(this.ctx.I18nMsg(I18nConst.LowIdentification), code.ERROR_SYSTEM, 'ERROR_SYSTEM');
                    return this.ctx.body = response;
                }

                let params = {
                    user_id: userId,
                    confidence: confidence,
                    person_picture: personPicture
                };

                let realAuthStep3Status = await this.ctx.service.c2c.userService.realAuthStep3(params);

                if (!realAuthStep3Status) {
                    response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError), code.ERROR_SYSTEM, 'ERROR_SYSTEM');
                    return this.ctx.body = response;
                }

                return this.ctx.body = response;

            }
        } catch (e) {
            this.ctx.logger.error(`Avatar realAuth error:  ${e.message} userId:${userId}`);
            response.errMsg(e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }

    async goAuth() {
        let response = Response();
        try {
            let json = await this.ctx.checkToken();
            let userId = json.uid;
            let realAuth = await this.ctx.service.c2c.userService.findOneRealAuth({user_id: userId});
            let noAuth = [];
            if (!realAuth || !realAuth.name || !realAuth.identity_card) {
                noAuth.push(1);
            }
            if (realAuth && (!realAuth.identity_card_picture || !realAuth.identity_card_picture2)) {
                noAuth.push(2);
            }
            if (realAuth && (!realAuth.person_picture)) {
                noAuth.push(3);
            }
            response.content.data = noAuth;

            return this.ctx.body = response;
        } catch (e) {
            this.ctx.logger.error(`Avatar goAuth error:  ${e.message}`);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }


    async setTransactionPassword() {
        let response = Response();
        try {
            let RuleErrors = this.ctx.Rulevalidate(userRule.setTransactionPassword, this.ctx.request.body);

            // 验证参数
            if (RuleErrors != undefined) {
                let errors = RuleErrors[0];
                response.errMsg(this.ctx.I18nMsg(I18nConst.VerifyFailed) + errors.message, code.ERROR_PARAMS, 'ERROR_PARAMS');
                return this.ctx.body = response;
            }

            let phone = this.ctx.request.body.phone;
            let wcode = this.ctx.request.body.code;
            let password = this.ctx.request.body.password;
            let smsCode = Number(wcode) || 0;

            if (!smsCode || wcode.length != 6) {
                response.errMsg('验证码不正确', code.ERROR_PARAMS, 'ERROR_PARAMS');
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

            let p = commonUtil.encrypt(commonUtil.decryptTranPWDByClient(password, result.user_id), result.user_id);
            if (!p) {
                this.ctx.logger.error(`setTransactionPassword decryptTranPWDByClient error `);
                response.errMsg(this.ctx.I18nMsg(I18nConst.NcorrectAccountOrPassword), code.ERROR_ACCOUNT_PASSWORD, 'ERROR_ACCOUNT_PASSWORD');
                return this.ctx.body = response;
            }
            let updateObj = {
                transaction_password: p
            };

            let updateStatus = await this.ctx.service.c2c.userService.modifyUserInfo(updateObj, whereObj);
            if (!updateStatus) {
                response.errMsg(this.ctx.I18nMsg(I18nConst.PasswordChangeFailed), code.ERROR_UPDATE_DATA, 'ERROR_UPDATE_DATA');
                return this.ctx.body = response;
            }

            return this.ctx.body = response;
        } catch (e) {
            console.error(`setTransactionPassword error: ${e.message}`);
            this.ctx.logger.error(`setTransactionPassword error: ${e.message}`);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }

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


    async authTransactionPassword() {
        let response = Response();
        try {
            let body = this.ctx.request.body;
            let RuleErrors = this.ctx.Rulevalidate(userRule.authTransactionPassword, body);

            // 验证参数
            if (RuleErrors != undefined) {
                let errors = RuleErrors[0];
                response.errMsg(this.ctx.I18nMsg(I18nConst.VerifyFailed) + errors.message, code.ERROR_PARAMS, 'ERROR_PARAMS');
                return this.ctx.body = response;
            }
            let json = await this.ctx.checkToken();
            let userId = json.uid;
            let userInfo = await this.ctx.service.c2c.userService.getUserInfoByObj({user_id: userId});
            if (!userInfo) {
                response.errMsg(this.ctx.I18nMsg(I18nConst.UserDoesNotExist), code.ERROR_USER_NOTFOUND, 'ERROR_USER_NOTFOUND');
                return this.ctx.body = response;
            }
            if (!userInfo.transaction_password) {
                response.errMsg(this.ctx.I18nMsg(I18nConst.PleaseSetTransactionPassword), code.ERROR_SET_PWD, 'ERROR_SET_PWD');
                return this.ctx.body = response;
            }
            if (userInfo.transaction_password != commonUtil.encrypt(commonUtil.decryptTranPWDByClient(body.password, userId)), userId) {
                response.errMsg(this.ctx.I18nMsg(I18nConst.IncorrectPassword), code.ERROR_TPWD_ERR, 'ERROR_TPWD_ERR');
                return this.ctx.body = response;
            }
            return this.ctx.body = response;
        } catch (e) {
            this.ctx.logger.error('Avatar authTransactionPassword error:', e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }

    }

    async bindBankCard() {
        let response = Response();
        try {
            let json = await this.ctx.checkToken();
            let userId = json.uid;
            let body = this.ctx.request.body;
            let RuleErrors = this.ctx.Rulevalidate(userRule.bindBankCard, body);


            // 验证参数
            if (RuleErrors != undefined) {
                let errors = RuleErrors[0];
                response.errMsg(this.ctx.I18nMsg(I18nConst.VerifyFailed) + errors.message, code.ERROR_PARAMS, 'ERROR_PARAMS');
                return this.ctx.body = response;
            }

            let keyId = body.keyId;
            let params = {
                bank_user_name: body.bankUserName,
                bank_card_no: body.bankCardNo,
                bank_name: body.bankName,
                bank_branch_name: body.bankBranchName
            };
            if (body.bankCardNo.length < 15 || body.bankCardNo.length > 20) {
                response.errMsg(this.ctx.I18nMsg(I18nConst.BankCardError), 'ERROR_PARAMS');
                return this.ctx.body = response;
            }
            if (keyId) {
                await this.ctx.service.c2c.userService.updateAccountBank(params, {key_id: keyId});
            } else {
                params.user_id = userId;
                params.type = 1;
                await this.ctx.service.c2c.userService.addAccountBank(params);
            }
            return this.ctx.body = response;
        } catch (e) {
            this.ctx.logger.error('Avatar bindBankCard error:', e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }

    async getBindBankCard() {
        let response = Response();
        try {
            let json = await this.ctx.checkToken();
            let userId = json.uid;
            let type = 1;
            let data = await this.ctx.service.c2c.userService.getAccountBankList(userId, type, ['key_id', 'bank_user_name', 'bank_card_no', 'bank_name', 'bank_branch_name', 'status']);
            response.content.data = data;
            return this.ctx.body = response;
        } catch (e) {
            this.ctx.logger.error('Avatar getBindBankCard error:', e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }

    async getBindAlipay() {
        let response = Response();
        try {
            let json = await this.ctx.checkToken();
            let userId = json.uid;
            let type = 2;
            let data = await this.ctx.service.c2c.userService.getAccountBankList(userId, type, ['key_id', 'alipay_user_name', 'alipay_account', 'alipay_qr_code', 'status']);
            if (data.length > 0) {
                for (let i = 0; i < data.length; i++) {
                    data[i].alipay_qr_code_url = qiniuUtil.getSignAfterUrl(data[i].alipay_qr_code, this.app.config.qiniuConfig);
                }
            }
            response.content.data = data;
            return this.ctx.body = response;
        } catch (e) {
            this.ctx.logger.error('Avatar getBindAlipay error:', e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }

    async getBindWechat() {
        let response = Response();
        try {
            let json = await this.ctx.checkToken();
            let userId = json.uid;
            let type = 3;
            let data = await this.ctx.service.c2c.userService.getAccountBankList(userId, type, ['key_id', 'wechat_user_name', 'wechat_account', 'wechat_qr_code', 'status']);
            if (data.length > 0) {
                for (let i = 0; i < data.length; i++) {
                    data[i].wechat_qr_code_url = qiniuUtil.getSignAfterUrl(data[i].wechat_qr_code, this.app.config.qiniuConfig);
                }
            }
            response.content.data = data;
            return this.ctx.body = response;
        } catch (e) {
            this.ctx.logger.error('Avatar getBindWechat error:', e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }


    async bindAlipay() {
        let response = Response();
        try {

            let json = await this.ctx.checkToken();
            let userId = json.uid;
            let body = this.ctx.request.body;
            let RuleErrors = this.ctx.Rulevalidate(userRule.bindAlipay, body);


            // 验证参数
            if (RuleErrors != undefined) {
                let errors = RuleErrors[0];
                response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + errors.message, code.ERROR_PARAMS, 'ERROR_PARAMS');
                return this.ctx.body = response;
            }

            let keyId = body.keyId;
            let params = {
                alipay_user_name: body.alipayUserName,
                alipay_account: body.alipayAccount,
                alipay_qr_code: body.alipayQrCode
            };
            if (keyId) {
                await this.ctx.service.c2c.userService.updateAccountBank(params, {key_id: keyId});
            } else {
                params.user_id = userId;
                params.type = 2;
                await this.ctx.service.c2c.userService.addAccountBank(params);
            }
            return this.ctx.body = response;
        } catch (e) {
            this.ctx.logger.error('Avatar bindAlipay error:', e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }


    async bindWechat() {
        let response = Response();
        try {
            let json = await this.ctx.checkToken();
            let userId = json.uid;
            let body = this.ctx.request.body;
            let RuleErrors = this.ctx.Rulevalidate(userRule.bindWechat, body);


            // 验证参数
            if (RuleErrors != undefined) {
                let errors = RuleErrors[0];
                response.errMsg(this.ctx.I18nMsg(I18nConst.VerifyFailed) + errors.message, code.ERROR_PARAMS, 'ERROR_PARAMS');
                return this.ctx.body = response;
            }

            let keyId = body.keyId;
            let params = {
                wechat_user_name: body.wechatUserName,
                wechat_account: body.wechatAccount,
                wechat_qr_code: body.wechatQrCode
            };
            if (keyId) {
                await this.ctx.service.c2c.userService.updateAccountBank(params, {key_id: keyId});
            } else {
                params.user_id = userId;
                params.type = 3;
                await this.ctx.service.c2c.userService.addAccountBank(params);
            }
            return this.ctx.body = response;

        } catch (e) {
            this.ctx.logger.error('Avatar bindWechat error:', e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }


    async getBanners() {
        let response = Response();
        try {
            let data = await this.ctx.service.c2c.userService.getBanners();
            for (let i = 0; i < data.length; i++) {
                data[i].image_url = qiniuUtil.getSignAfterUrl(data[i].img_key, this.app.config.qiniuConfig);
            }
            response.content.data = data;
            return this.ctx.body = response;
        } catch (e) {
            this.ctx.logger.error('Avatar getBanners error:', e.message);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }


}

module.exports = UserController;
