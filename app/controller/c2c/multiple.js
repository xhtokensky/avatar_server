'use strict';

const fs = require('mz/fs');
const path = require('path');
const qiniu = require('./../../utils/qiniu');
const Controller = require('egg').Controller;
const uuidUtil = require('./../../utils/uuid');
const dateUtil = require('./../../utils/dateUtil');
const code = require("../../utils/code");
let Response = require('./../../utils/resObj');
const I18nConst = require('./../../../config/constant/i18n');

const maxImgSize = 1024 * 1024 * 2;

module.exports = class extends Controller {


    async upload() {
        let response = Response();
        try {
            const qiniuConfig = this.app.config.qiniuConfig;
            const qiniuToken = qiniu.upToken(qiniuConfig);

            const {ctx} = this;
            const files = ctx.request.files;

            let originalFilename = files[0].filename;
            let $KEY = dateUtil.numberDate() + '_' + originalFilename;
            let reg = new RegExp("[\\u4E00-\\u9FFF]+", "g");
            if (reg.test(originalFilename)) {
                $KEY = uuidUtil.v1();
            }
            let body = await qiniu.uploadFile(files[0].filepath, $KEY, qiniuToken);
            if (!body.success) {
                response.errMsg(this.ctx.I18nMsg(I18nConst.UploadFailed), code.ERROR_SYSTEM, 'ERROR_SYSTEM');
                return this.ctx.body = response;
            }


            let imgKey = body.key;
            let imgUrl = qiniu.getSignAfterUrl(imgKey, qiniuConfig);
            response.content.data = {
                imgUrl: imgUrl,
                imgKey: imgKey
            };
            return this.ctx.body = response;
        } catch (e) {
            console.error(`upload error: ${e.message}`);
            this.ctx.logger.error(`upload error: ${e.message}`);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }
    }


    async batchUploadFile() {
        let response = Response();
        try {
            const qiniuConfig = this.app.config.qiniuConfig;
            const qiniuToken = qiniu.upToken(qiniuConfig);
            const {ctx} = this;
            const files = ctx.request.files;
            let result = [];
            if (Array.isArray(files) && files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    let originalFilename = files[i].filename;
                    let $KEY = dateUtil.numberDate() + '_' + originalFilename;
                    let reg = new RegExp("[\\u4E00-\\u9FFF]+", "g");
                    if (reg.test(originalFilename)) {
                        $KEY = uuidUtil.v1();
                    }
                    let body = await qiniu.uploadFile(files[i].filepath, $KEY, qiniuToken);
                    if (!body.success) {
                        break;
                        response.errMsg(this.ctx.I18nMsg(I18nConst.UploadFailed), code.ERROR_SYSTEM, 'ERROR_SYSTEM');
                        return this.ctx.body = response;
                    }
                    let imgKey = body.key;
                    let imgUrl = qiniu.getSignAfterUrl(imgKey, qiniuConfig);
                    result.push({imgKey: imgKey, imgUrl: imgUrl})
                }
            }
            response.content.data = result;
            return this.ctx.body = response;
        } catch (e) {
            console.error(`batchUploadFile error: ${e.message}`);
            this.ctx.logger.error(`batchUploadFile error: ${e.message}`);
            response.errMsg(this.ctx.I18nMsg(I18nConst.SystemError) + e.message, code.ERROR_SYSTEM, 'ERROR_SYSTEM');
            return this.ctx.body = response;
        }

    }

};
//http://mifengcha.oss-cn-beijing.aliyuncs.com/static/coinInfo/piplcoin.png
//curl localhost:9000/avatar/c2c/uploadFile -F "file=@/Users/liusheng/Pictures/1228.png" -H "token:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjI3LCJpYXQiOjE1NTk1Mjg4NjIsImV4cCI6MTU2MjEyMDg2Mn0.t1daSsY-iLVNRBQ_qVnJuoimcay_KoHqJzIvz21eblE" -v
/*

[
    {
        "field": "file",
        "filename": "1228.png",
        "encoding": "7bit",
        "mime": "application/octet-stream",
        "fieldname": "file",
        "transferEncoding": "7bit",
        "mimeType": "application/octet-stream",
        "filepath": "/var/folders/rn/fmvmkl3j0ndf44j16rjxr24h0000gn/T/egg-multipart-tmp/tokensky_avatar_server/2019/06/06/17/f3b20743-5dfa-4914-a349-a2d67b1f059f.png"
    },
    {
        "field": "file",
        "filename": "test1.png",
        "encoding": "7bit",
        "mime": "application/octet-stream",
        "fieldname": "file",
        "transferEncoding": "7bit",
        "mimeType": "application/octet-stream",
        "filepath": "/var/folders/rn/fmvmkl3j0ndf44j16rjxr24h0000gn/T/egg-multipart-tmp/tokensky_avatar_server/2019/06/06/17/06214f9e-4ef7-40da-a97e-8e41a1933d13.png"
    }
]*/

