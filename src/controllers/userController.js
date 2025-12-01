import userService from "../services/userService.js";

const userController = {
  async createUser(req, res) {
    try {
      const data = req.body;
      const user = req.user;
      const result = await userService.createUser({ ...data, user });
      return res.status(200).json(result);
    } catch (error) {
      console.log(error);
      return res.status(400).json(error.message);
    }
  },

  async getUsers(req, res) {
    try {
      const result = await userService.getUsers();
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json(error.message);
    }
  },

  async updateUser(req, res) {
    try {
      const data = req.body;
      const result = await userService.updateUser(data);
      return res.status(200).json(result);
    } catch (error) {
      console.log(error);
      return res.status(400).json(error.message);
    }
  },

  async getUser() {},

  async deleteUser(req, res) {
    try {
      const user = req.user;
      const result = await userService.deleteUser({ ...req.params, user });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json(error.message);
    }
  },
};

export default userController;
