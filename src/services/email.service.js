const brevo = require("@getbrevo/brevo");
const config = require("../config/env");
const AppError = require("../utils/app-error");

const client = new brevo.BrevoClient({
  apiKey: config.brevoApiKey,
});

async function sendVerificationEmail(email, firstName, otp) {
  if (!config.brevoApiKey || config.brevoApiKey === "your-brevo-api-key-here") {
    console.log(`\n=== 🚧 LOCAL DEV MODE: EMAIL BYPASSED ===`);
    console.log(`To: ${email} (${firstName})`);
    console.log(`Subject: Your Verification Code - GMTTickets`);
    console.log(`[OTP CODE]: ${otp}`);
    console.log(`===========================================\n`);
    return { success: true, messageId: "local-dev-mock-id" };
  }

  const sendSmtpEmail = {
    subject: "Your Verification Code - GMTTickets",
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Welcome to GMTTickets!</h2>
        <p>Hello ${firstName},</p>
        <p>Thank you for signing up. To complete your registration, please use the following One-Time Password (OTP) to verify your email address:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4CAF50;">${otp}</span>
        </div>
        <p style="color: #666; font-size: 14px;">This code will expire in 15 minutes. If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">&copy; 2026 GMTTickets. All rights reserved.</p>
      </div>
    `,
    sender: { name: "GMTTickets", email: config.brevoSenderEmail },
    to: [{ email, name: firstName }],
    replyTo: { email: config.brevoSenderEmail },
  };

  try {
    const response =
      await client.transactionalEmails.sendTransacEmail(sendSmtpEmail);
    return {
      success: true,
      messageId: response.messageId,
    };
  } catch (error) {
    console.error("Brevo email error:", error);
    // If Brevo reports unauthorized, log a helpful warning and fallback to console output
    if (
      error &&
      (error.statusCode === 401 ||
        (error.body && error.body.code === "unauthorized"))
    ) {
      console.warn(
        "Brevo API unauthorized. Falling back to console output. Check BREVO_API_KEY in your environment.",
      );
      console.log(`\n=== 🚧 BREVO UNAUTHORIZED - FALLBACK EMAIL ===`);
      console.log(`To: ${email} (${firstName})`);
      console.log(`Subject: Your Verification Code - GMTTickets`);
      console.log(`[OTP CODE]: ${otp}`);
      console.log(`===========================================\n`);
      return { success: true, messageId: "brevo-unauth-fallback" };
    }

    throw new AppError(
      "Failed to send verification email. Please try again later.",
      500,
    );
  }
}

async function sendWelcomeEmail(email, firstName) {
  if (!config.brevoApiKey || config.brevoApiKey === "your-brevo-api-key-here") {
    console.log(`\n=== 🚧 LOCAL DEV MODE: EMAIL BYPASSED ===`);
    console.log(`To: ${email} (${firstName})`);
    console.log(`Subject: Welcome to GMTTickets!`);
    console.log(`Message: Welcome email would be sent here.`);
    console.log(`===========================================\n`);
    return { success: true };
  }

  const sendSmtpEmail = {
    subject: "Welcome to GMTTickets!",
    htmlContent: `
      <h2>Welcome to GMTTickets, ${firstName}!</h2>
      <p>Your email has been verified and your account is now active.</p>
      <p>You can now:</p>
      <ul>
        <li>Create and list tickets</li>
        <li>Buy and sell tickets</li>
        <li>Manage your profile</li>
      </ul>
      <p>Happy ticket trading!</p>
    `,
    sender: { name: "GMTTickets", email: config.brevoSenderEmail },
    to: [{ email, name: firstName }],
    replyTo: { email: config.brevoSenderEmail },
  };

  try {
    const response =
      await client.transactionalEmails.sendTransacEmail(sendSmtpEmail);
    return {
      success: true,
      messageId: response.messageId,
    };
  } catch (error) {
    console.error("Brevo welcome email error:", error);
    if (
      error &&
      (error.statusCode === 401 ||
        (error.body && error.body.code === "unauthorized"))
    ) {
      console.warn(
        "Brevo API unauthorized. Falling back to console output for welcome email.",
      );
      console.log(`\n=== 🚧 BREVO UNAUTHORIZED - WELCOME EMAIL FALLBACK ===`);
      console.log(`To: ${email} (${firstName})`);
      console.log(`Subject: Welcome to GMTTickets!`);
      console.log(`Message: Welcome email would be sent here.`);
      console.log(`===========================================\n`);
      return { success: true, messageId: "brevo-unauth-welcome-fallback" };
    }

    return { success: false };
  }
}

async function sendPasswordResetEmail(email, firstName, otp) {
  if (!config.brevoApiKey || config.brevoApiKey === "your-brevo-api-key-here") {
    console.log(`\n=== 🚧 LOCAL DEV MODE: PASSWORD RESET EMAIL BYPASSED ===`);
    console.log(`To: ${email} (${firstName})`);
    console.log(`Subject: Password Reset - GMTTickets`);
    console.log(`[OTP / token]: ${otp}`);
    console.log(
      `Reset URL: ${config.frontendUrl}/reset-password?email=${encodeURIComponent(email)}&token=${otp}`,
    );
    console.log(`===========================================\n`);
    return { success: true, messageId: "local-dev-mock-id" };
  }

  const resetUrl = `${config.frontendUrl}/reset-password?email=${encodeURIComponent(email)}&token=${otp}`;

  const sendSmtpEmail = {
    subject: "Password Reset - GMTTickets",
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
        <p>Hello ${firstName || "user"},</p>
        <p>We received a request to reset your GMTTickets password. Use the code below or click the button to set a new password.</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
          <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #F44336;">${otp}</span>
        </div>
        <p style="text-align:center;">
          <a href="${resetUrl}" style="background:#4CAF50;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Reset Password</a>
        </p>
        <p style="color: #666; font-size: 14px;">This code will expire in 15 minutes. If you didn't request this, ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">&copy; 2026 GMTTickets. All rights reserved.</p>
      </div>
    `,
    sender: { name: "GMTTickets", email: config.brevoSenderEmail },
    to: [{ email, name: firstName }],
    replyTo: { email: config.brevoSenderEmail },
  };

  try {
    const response =
      await client.transactionalEmails.sendTransacEmail(sendSmtpEmail);
    return {
      success: true,
      messageId: response.messageId,
    };
  } catch (error) {
    console.error("Brevo password reset email error:", error);
    if (
      error &&
      (error.statusCode === 401 ||
        (error.body && error.body.code === "unauthorized"))
    ) {
      console.warn(
        "Brevo API unauthorized. Falling back to console output for password reset email. Check BREVO_API_KEY.",
      );
      console.log(`\n=== 🚧 BREVO UNAUTHORIZED - PASSWORD RESET FALLBACK ===`);
      console.log(`To: ${email} (${firstName})`);
      console.log(`Subject: Password Reset - GMTTickets`);
      console.log(`[OTP / token]: ${otp}`);
      console.log(
        `Reset URL: ${config.frontendUrl}/reset-password?email=${encodeURIComponent(email)}&token=${otp}`,
      );
      console.log(`===========================================\n`);
      return { success: true, messageId: "brevo-unauth-reset-fallback" };
    }

    throw new AppError(
      "Failed to send password reset email. Please try again later.",
      500,
    );
  }
}

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
};
