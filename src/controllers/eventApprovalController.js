import eventApprovalService from "../services/eventAppprovalService.js";
export const eventApprovalController = {
  async creatApproval(req, res) {
    try {
      const { id: ma_su_kien } = req.body;
      const user = req.user;
      const result = await eventApprovalService.creatApproval({
        ma_su_kien,
        user,
      });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json(error.message);
    }
  },

  async getApprovals(req, res) {
    try {
      const result = await eventApprovalService.getApprovals();
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json(error.message);
    }
  },

  async updateApproval(req, res) {
    try {
      const { id: id_su_kien_phe_duyet } = req.params;
      const data = req.body;
      const user = req.user;

      const result = await eventApprovalService.updateApproval({
        id_su_kien_phe_duyet,
        ...data,
        user,
      });
      return res.status(200).json(result);
    } catch (error) {
      console.log(error);
      res.status(400).json(error.message);
    }
  },
};
