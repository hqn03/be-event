import { PrismaClient as MySQLClient } from "../generated/mysql/index.js";
const mysql = new MySQLClient();

const ticketService = {
  async createTicket({}) {},
};

export default ticketService;
