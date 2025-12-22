// import { signUp as signUpService } from "../services/authService.js";
import authService from "../services/authService.js";
import { successResponse, errorResponse } from "../utils/response.js";

const authController = {
  async login(req, res) {
    try {
      const result = await authService.login(req.body);
      res.status(200).json(result);
    } catch (error) {
      console.log(error);
      res.status(400).json(error);
    }
  },
  async signUp(req, res) {
    try {
      const result = await authService.signUp(req.body);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json(error);
    }
  },
  async verifyAccount(req, res) {
    try {
      const result = await authService.verify(req.query.token);

      res.redirect("http://localhost:5173/successful-verification");
    } catch (err) {
      res.status(400).json();
    }
  },
  async resendToken(req, res) {
    try {
      const result = await authService.resendToken(req.body);
      res.status(200).json(successResponse({ data: result }));
    } catch (err) {
      res.status(400).json(errorResponse(err.message));
    }
  },
  async getMe(req, res) {
    const user = req.user;
    res.status(200).json(user);
  },
};

export default authController;
