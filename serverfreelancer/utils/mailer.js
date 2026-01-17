import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text) => {
  try {
    // 1️⃣ Create a transporter
    const transporter = nodemailer.createTransport({
      service: "gmail", // you can also use SMTP or any other service
      auth: {
        user: "yourgmail@gmail.com", // ⚠️ replace with your email
        pass: "your-app-password", // ⚠️ use App Password (not Gmail password)
      },
    });

    // 2️⃣ Define email options
    const mailOptions = {
      from: '"Freelancer App" <yourgmail@gmail.com>',
      to,
      subject,
      text,
    };

    // 3️⃣ Send email
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};
