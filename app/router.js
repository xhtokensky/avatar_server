'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
    const jiguang = require('./utils/jiguang');
    jiguang.__init.call(app);

    const {router, controller} = app;
    require('./router/c2c')(app);
    require('./router/msg')(app);
    require('./router/user')(app);
};
