import nodemailer from "nodemailer";

export const transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "a69e6f9d5d3fb8",
    pass: "4381bfc6785f2e",
  },
});

const mailService = {
  async send(to, subject, html) {
    try {
      await transport.sendMail({
        from: `"Your App" <${process.env.MAIL_USER}>`,
        to,
        subject,
        html,
      });
      console.log("📧 Email đã gửi tới:", to);
    } catch (error) {
      console.error("❌ Lỗi gửi mail:", error);
      throw error;
    }
  },
};

export default mailService;
