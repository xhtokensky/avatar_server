module.exports = app => {
    const {router, controller} = app;

    const isAuthenticated = app.middleware.isAuthenticated();

    router.get("/avatar/getMessageList/:pageNum/:pageSize", isAuthenticated, controller.msg.msg.getMessageList);
    router.get("/avatar/newMessage", controller.msg.msg.getNewMessage);
    router.post('/avatar/readMessage',isAuthenticated,controller.msg.msg.readMessage);
    router.get('/avatar/redPort',isAuthenticated,controller.msg.msg.getRedPort);

};
