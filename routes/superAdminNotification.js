
const superAdminNotificationController = require("../controller/superAdminNotification/superAdminNotification")

module.exports = (app) => {

    // list of all unread notification
    app.get('/superAdmin/notification/list/unread/:userId', superAdminNotificationController.listNotificationUnread);

    // list of all read notification
    app.get('/superAdmin/notification/list/read/:userId', superAdminNotificationController.listNotificationRead);

    // count unread Notification
    app.get('/superAdmin/notification/count/unread/:userId', superAdminNotificationController.countUnreadNotification)

    // view particular notification
    app.get('/superAdmin/notification/view/:id', superAdminNotificationController.view);

    // delete particular notification
    app.delete('/superAdmin/notification/delete/:id', superAdminNotificationController.delete)

};