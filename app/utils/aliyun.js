const Core = require('@alicloud/pop-core');
const qs = require("querystring");
const http = require("https");
const request = require('request');
const url = require('url');
const crypto = require('crypto');
const rp = require('request-promise');
const uuidUtil = require('./uuid');
const images = require("images");
const fs = require('fs');

exports.SendSms = async function ({phone, templateParam, phoneAreaCode = '86', smsType}) {
    try {
        let client = new Core({
            accessKeyId: this.app.config.aliYun.AccessKeyID,
            accessKeySecret: this.app.config.aliYun.AccessKeySecret,
            endpoint: 'https://dysmsapi.aliyuncs.com',
            apiVersion: '2017-05-25'
        });

        let params = {
            "PhoneNumbers": phone,
            "SignName": this.app.config.aliYun.SignName,
            "TemplateCode": '',
            "TemplateParam": JSON.stringify(templateParam)
        };

        if (phoneAreaCode != '86') {
            params.SignName = this.app.config.aliYun.CommonSignName;
        }

        if (smsType == 1) {
            let tid = this.app.config.aliYun.CN.TemplateCodeLogin;
            if (phoneAreaCode != '86') {
                if (this.app.config.aliYun.US.TemplateCodeLogin) {
                    tid = this.app.config.aliYun.US.TemplateCodeLogin;
                }
            }
            params.TemplateCode = tid;
        } else {
            let tid = this.app.config.aliYun.CN.TemplateCodeUpdate;
            if (phoneAreaCode != '86') {
                if (this.app.config.aliYun.US.TemplateCodeUpdate) {
                    tid = this.app.config.aliYun.US.TemplateCodeUpdate;
                }
            }
            params.TemplateCode = tid;
        }
        let requestOption = {
            method: 'POST'
        };

        let result = await client.request('SendSms', params, requestOption);
        return result;
    } catch (e) {
        this.ctx.logger.error('aliyun sendSms error ', e.message);
        console.error('aliyun sendSms error ', e.message);
        return {};
    }
};


const saveImageToLoc = async (url) => {
    return new Promise((resolve, reject) => {
        if (!url) {
            reject(null);
        }
        let http = require('http'), fs = require('fs');
        let urlheader = url.split(':')[0];
        if (urlheader == 'http') {
            http = require('http');
        }
        if (urlheader == 'https') {
            http = require('https');
        }
        http.get(url, function (req, res) {  //path为网络图片地址
            let imgData = '';
            req.setEncoding('binary');
            req.on('data', function (chunk) {
                imgData += chunk
            });
            req.on('end', function () {
                let dir = __dirname;
                dir = dir.replace('utils', 'public');
                fs.exists(dir, (exists) => {
                    if (!exists) {
                        fs.mkdirSync(dir)
                    }
                    let locpath = dir + '/' + uuidUtil.v1() + '.jpg';
                    fs.writeFile(locpath, imgData, 'binary', function (err) {  //path为本地路径例如public/logo.png
                        if (err) {
                            console.log('保存出错！');
                            reject(err);
                        } else {
                            console.log('保存成功!');
                            resolve(locpath);
                        }
                    })
                });
            })
        })
    });
};


const zoomImageToLoc = async (url) => {
    let dir = __dirname;
    dir = dir.replace('utils', 'public');
    let locpath = dir + '/' + uuidUtil.v1() + '.jpg';
    images(url)                     //Load image from file
    //加载图像文件
        .size(400)                          //Geometric scaling the image to 400 pixels width
        .save(locpath, {               //Save the image to a file, with the quality of 50
            quality: 50                    //保存图片到文件,图片质量为50
        });
    return locpath;
};


const imageToBase64 = (url) => {
    let bitmap = fs.readFileSync(url);
    let base64str = Buffer.from(bitmap, 'binary').toString('base64');
    return base64str;
};

const removeImage = (url) => {
    fs.unlink(url, function (err) {
        if (err) {
            console.log('removeImage error:', err.message);
            throw err;
        }
    })
};


/**
 * 识别身份证
 * @param url
 * @param side
 * @returns {Promise<any>}
 */
//https://market.aliyun.com/products/57000002/cmapi033391.html#sku=yuncode2739100001
exports.ocrDiscern = async function (url, side = 'front') {//back

    try {

        let locpath = await saveImageToLoc(url);
        let zoomlocpath = await zoomImageToLoc(locpath);
        fs.stat(locpath, (error, stats) => {
            if (!error) {
                this.ctx.logger.error(`原图大小：${parseInt(stats.size / 1024)} kb`)
            }
        });
        removeImage(locpath);
        this.ctx.sleep(100);
        let base64Image = imageToBase64(zoomlocpath);
        fs.stat(zoomlocpath, (error, stats) => {
            if (!error) {
                this.ctx.logger.error(`压缩后大小：${parseInt(stats.size / 1024)} kb`)
            }
        });
        removeImage(zoomlocpath);
        //let base64Image = await this.app.convertImageToBase64(url);
        const self = this;
        self.ctx.logger.error('url:', url);
        const options = {
            method: 'POST',
            json: true,
            url: 'https://yixi.market.alicloudapi.com/ocr/idcard',
            form: {image: base64Image, side: side},
            headers:
                {
                    'cache-control': 'no-cache',
                    Connection: 'keep-alive',
                    Accept: '*!/!*',
                    Authorization: `APPCODE ${self.app.config.aliYun.AppCode}`,
                    'Content-Type': 'application/x-www-form-urlencoded'

                }
        };
        let body = await rp(options);
        console.log(body)
        if (!body) {
            return {
                success: false,
                msg: '识别失败,请稍后重试.认证服务繁忙'
            };
        }
        if (body.code == 200) {

            return {
                success: true,
                data: body.data
            };
        } else {
            return {
                success: false,
                msg: '识别失败,请上传正确的身份证.'
            };
        }
    } catch (e) {

        this.ctx.logger.error(`ocrDiscern error:${e}`);
        return {
            success: false,
            msg: '认证服务繁忙'
        };
    }

    /* return new Promise(async (resolve, reject) => {
         const options = {
             method: 'POST',
             json: true,
             url: 'https://yixi.market.alicloudapi.com/ocr/idcard',
             form: {image: base64Image, side: side},
             headers:
                 {
                     'cache-control': 'no-cache',
                     Connection: 'keep-alive',
                     Accept: '*!/!*',
                     Authorization: `APPCODE ${self.app.config.aliYun.AppCode}`,
                     'Content-Type': 'application/x-www-form-urlencoded'

                 }
         };
         request(options, function (error, response, body) {
             self.ctx.logger.error(body);
             if (error) {
                 self.ctx.getLogger('recordLogger').error('ocrAuth : ', error, body);
                 reject(new Error('识别失败，请稍后重试'));
             } else {
                 if (!body) {
                     reject(new Error('识别失败,请稍后重试.认证服务繁忙'));
                 } else {
                     if (body.code == 200) {
                         resolve(body.data);
                     } else {
                         self.ctx.getLogger('recordLogger').error('ocrAuth : ', body);
                         reject(new Error('识别失败,请上传正确的身份证.'));
                     }
                 }
             }
         });
     });*/
};


/**
 * 验证身份证
 * @param idcard
 * @param realname
 * @returns {Promise<any>}
 */
//https://market.aliyun.com/products/57000002/cmapi031844.html?#sku=yuncode2584400004
exports.ocrAuth = async function (idcard, realname) {
    const self = this;
    return new Promise(async (resolve, reject) => {
        const options = {
            method: 'GET',
            json: true,
            url: 'https://yxidcard.market.alicloudapi.com/idcard',
            qs: {idcard: idcard, realname: realname},
            headers:
                {
                    'cache-control': 'no-cache',
                    Connection: 'keep-alive',
                    Host: 'yxidcard.market.alicloudapi.com',
                    Accept: '*/*',
                    Authorization: `APPCODE ${self.app.config.aliYun.AppCode}`,
                    'Content-Type': 'application/x-www-form-urlencoded'

                },
            form: false
        };
        request(options, function (error, response, body) {
            if (error) {
                self.ctx.getLogger('recordLogger').error('ocrAuth : ', error, body);
                reject(new Error('识别失败，请稍后重试'));
            } else {
                if (body.code == 200) {
                    resolve(body.data);
                } else {
                    self.ctx.getLogger('recordLogger').error('ocrAuth : ', body);
                    reject(new Error('姓名与身份证不匹配.'));
                }
            }
        });
    });
};


/**
 * 人脸对比分析
 * @returns {Promise<void>}
 */
//https://data.aliyun.com/product/face?spm=a2c4g.11186623.2.10.13fc3f27qlE8lw
exports.ocrFace = async function (img1, img2) {
    return new Promise(async (resolve, reject) => {
        try {
            let ak_id = this.app.config.aliYun.AccessKeyID;
            let ak_secret = this.app.config.aliYun.AccessKeySecret;
            let date = new Date().toUTCString();
            let options = {
                url: 'https://dtplus-cn-shanghai.data.aliyuncs.com/face/verify',
                method: 'POST',
                body: JSON.stringify({
                    "type": 0,
                    "image_url_1": img1,
                    "image_url_2": img2
                }),
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/json',
                    'date': date,
                    'Authorization': ''
                }
            };
            let md5 = function (buffer) {
                let hash;
                hash = crypto.createHash('md5');
                hash.update(buffer);
                return hash.digest('base64');
            };
            let sha1 = function (stringToSign, secret) {
                var signature;
                return signature = crypto.createHmac('sha1', secret).update(stringToSign).digest().toString('base64');
            };

            let body = options.body || '';
            let bodymd5;
            if (body === void 0 || body === '') {
                bodymd5 = body;
            } else {
                bodymd5 = md5(new Buffer(body));
            }

            let stringToSign = options.method + "\n" + options.headers.accept + "\n" + bodymd5 + "\n" + options.headers['content-type'] + "\n" + options.headers.date + "\n" + url.parse(options.url).path;

            let signature = sha1(stringToSign, ak_secret);

            let authHeader = "Dataplus " + ak_id + ":" + signature;

            options.headers.Authorization = authHeader;

            request(options, function (error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    try {
                        body = JSON.parse(body);
                        console.log(body)
                        if (body.errno == 0) {
                            resolve(body);
                        } else {
                            reject(new Error('系统繁忙,请稍后重试。'))
                        }
                    } catch (e) {
                        reject(new Error('系统繁忙,请稍后重试。'))
                    }
                }
            });
        } catch (e) {
            reject(e);
        }
    });

};
