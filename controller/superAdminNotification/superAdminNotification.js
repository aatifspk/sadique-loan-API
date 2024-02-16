

const statusCode = require('../../utils/http-status-code');
const errorMessage = require('../../languages/message');

const SuperAdminNotification = require("../../models/superAdminNotification/superAdminNotification")


// list of unread notification
exports.listNotificationUnread = async (req, res) => {

    try {

        const { userId } = req.params;

        const allNotification = await SuperAdminNotification.find({
            isRead: false,
            userId : userId
        });

        return res.status(statusCode.OK).send({
            message: "All Notification Found Success...",
            count: allNotification.length,
            List: allNotification,
        })

    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })

    }

}


// list of read notification
exports.listNotificationRead = async (req, res) => {

    try {

        const { userId } = req.params;

        const allNotification = await SuperAdminNotification.find({
            isRead: true,
            userId : userId
            
        });

        return res.status(statusCode.OK).send({
            message: "All Notification Found Success...",
            count: allNotification.length,
            List: allNotification,
        })

    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })

    }

}


// Count unread notification
exports.countUnreadNotification = async (req, res) => {
    try {
        const { userId } = req.params;
        const unreadMessages = await SuperAdminNotification.find({
            isRead : false,
            userId : userId
        });

        return res
            .status(statusCode.OK)
            .send({ message: 'Count unread notifications!', count : unreadMessages.length });
    } catch (error) {
        return res
            .status(statusCode.InternalServerError)
            .send({ message: error.message || errorMessage.lblInternalServerError });
    }
};


// View notification
exports.view = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await SuperAdminNotification.findOneAndUpdate(
            { _id: id },
            { $set: { isRead: true } },
            { new: true }
        );

        if (!notification) {
            return res
                .status(statusCode.OK)
                .send({ message: 'No notification to view!' });
        }

        return res
            .status(statusCode.OK)
            .send({ message: 'View notification!', data: { ...notification.toObject(), importantId: JSON.parse(notification.importantId) } });
    } catch (error) {
        return res
            .status(statusCode.InternalServerError)
            .send({ message: error.message || errorMessage.lblInternalServerError });
    }
};


// Delete notification
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        const isExist = await SuperAdminNotification.findById(id);

        if (!isExist) {
            return res
                .status(statusCode.OK)
                .send({ message: 'No notification to view!' });
        }

        await SuperAdminNotification.deleteOne({
           _id : id
        });

        return res
            .status(statusCode.OK)
            .send({ message: 'Notification delete successfully!' });
    } catch (error) {
        return res
            .status(statusCode.InternalServerError)
            .send({ message: error.message || errorMessage.lblInternalServerError });
    }
};