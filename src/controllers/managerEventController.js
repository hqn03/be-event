import { errorResponse, successResponse } from "../utils/response.js";
import managerEventService from "../services/managerEventService.js";

const managerEventController = {
  async getEvents(req, res) {
    try {
      const { status } = req.query;
      const user = req.user;
      const result = await managerEventService.getEvents({ status, user });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json(errorResponse({ message: error.message }));
    }
  },

  async createEvent(req, res) {
    try {
      const data = req.body;
      const user = req.user;
      const result = await managerEventService.createEvent({ ...data, user });
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json(errorResponse({}));
    }
  },

  async updateEvent(req, res) {
    console.log("[UPDATE EVENT] ");
    try {
      const { id } = req.params;
      const data = req.body;
      const user = req.user;

      const result = await managerEventService.updateEvent({
        id,
        ...data,
        user,
      });
      return res.status(200).json(result);
    } catch (error) {
      console.log(error.message);
      return res.status(400).json(errorResponse({}));
    }
  },

  async deleteEvent(req, res) {
    try {
      const { id: ma_su_kien } = req.params;
      const user = req.user;
      const result = await managerEventService.deleteEvent({
        ma_su_kien,
        user,
      });
      res.status(200).json(result);
    } catch (error) {
      console.log(error);
      res.status(400).json(error.message);
    }
  },

  async getEvent(req, res) {
    try {
      const { id: ma_su_kien } = req.params;
      const user = req.user;
      const result = await managerEventService.getEvent({ ma_su_kien, user });
      return res.status(200).json(result);
    } catch (error) {
      console.log(error);
      return res.status(400).json(errorResponse({}));
    }
  },
};

export default managerEventController;
