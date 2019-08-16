'use strict';

const Service = require('egg').Service;
const svgCaptcha = require('svg-captcha');
const captchapng = require('captchapng');

class ToolsService extends Service {
    // 产生验证码
    async captcha() {
        const captcha = svgCaptcha.create({
            size: 5,// 验证码长度
            ignoreChars: '0o1i', // 验证码字符中排除 0o1i
            noise: 2, // 干扰线条的数量
            height: 44
        });
        this.ctx.session.code = captcha.text;
        return captcha;
    }

    async getIcode() {
        let code = parseInt(Math.random()*9000+1000);
        let capt = new captchapng(80,30,code);
        capt.color(0, 0, 0, 0);
        capt.color(80, 80, 80, 255);
        let icodeImg = capt.getBase64();
        return {code:code, img:icodeImg};
    }
}

module.exports = ToolsService;