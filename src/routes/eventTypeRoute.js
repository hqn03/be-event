import { Router } from "express";
import eventTypeController from "../controllers/eventTypeController.js";

const eventTypeRoute = Router();

eventTypeRoute.get("/", eventTypeController.getEventTypes);

eventTypeRoute.put("/", eventTypeController.updateEventType);

eventTypeRoute.post("/", eventTypeController.createEventType);

eventTypeRoute.delete("/:id", eventTypeController.deleteEventType);

export default eventTypeRoute;
