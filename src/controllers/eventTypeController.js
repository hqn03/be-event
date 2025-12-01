import eventTypeService from "../services/eventTypeService.js";
import { errorResponse, successResponse } from "../utils/response.js";

const eventTypeController = {
  async getEventTypes(req, res) {
    try {
      const result = await eventTypeService.listEventType();
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json(error.message);
    }
  },

  async updateEventType(req, res) {
    try {
      const data = req.body;
      const result = await eventTypeService.updateEventType(data);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json(error.message);
    }
  },

  async createEventType(req, res) {
    try {
      const data = req.body;
      const result = await eventTypeService.createEventType(data);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json(error.message);
    }
  },

  async deleteEventType(req, res) {
    try {
      const data = req.params;
      const result = await eventTypeService.deleteEventType(data);
      console.log(result);
      return res.status(200).json(result);
    } catch (error) {
      console.log(error);
      return res.status(400).json(error.message);
    }
  },
};

export default eventTypeController;
