import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const SendEmail = async (options) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Task Manager",
      link: "https://taskmanagerlink.com",
    },
  });
  const emailText = mailGenerator.generatePlaintext(options.mailgenContent);
  const emailhtml = mailGenerator.generate(options.mailgenContent);

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_TRAP_HOST,
    port: process.env.MAIL_TRAP_PORT,
    auth: {
      user: process.env.MAIL_TRAP_USER,
      pass: process.env.MAIL_TRAP_PASS,
    },
  });

  const mail = {
    from: "mail.taskmanager@example.com",
    to: options.email,
    subject: options.subject,
    text: emailText,
    html: emailhtml,
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.error("email service failed");
  }
};

const emailVerification = (username, verificationURL) => {
  return {
    body: {
      name: username,
      intro: "Welcome to our app!",
      action: {
        instructions: "To verify please click on the following button",
        button: {
          color: "#22BC66",
          text: "verify your email",
          link: verificationURL,
        },
      },
      outro: "Need help or have any questions just reply to this email",
    },
  };
};

const emailPasswordreset = (username, PasswordResetURL) => {
  return {
    body: {
      name: username,
      intro: "We got a request to reset the password of your account",
      action: {
        instructions:
          "To reset the password please click on the following button",
        button: {
          color: "#22BC66",
          text: "Reset your email",
          link: PasswordResetURL,
        },
      },
      outro: "Need help or have any questions just reply to this email",
    },
  };
};

export { emailVerification };
export { emailPasswordreset };
export { SendEmail };
