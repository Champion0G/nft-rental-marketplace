import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendExpiryNotification = async (
  email: string,
  tokenId: string,
  remainingTime: number,
  renter: string
) => {
  const hours = Math.floor(remainingTime / 3600);
  const minutes = Math.floor((remainingTime % 3600) / 60);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `NFT Rental Expiry Notification for Token #${tokenId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">NFT Rental Expiry Notice</h2>
        <p>Dear NFT Renter,</p>
        <p>Your rental for <strong>Token #${tokenId}</strong> will expire in:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin: 0;">
            ${hours} hours and ${minutes} minutes
          </h3>
        </div>
        <p>Rental Details:</p>
        <ul>
          <li>Token ID: #${tokenId}</li>
          <li>Renter Address: ${renter}</li>
          <li>Remaining Time: ${hours}h ${minutes}m</li>
        </ul>
        <p>Please take the necessary action before your rental expires.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated notification from the NFT Rental Marketplace.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Expiry notification sent to ${email} for Token #${tokenId}`);
  } catch (err) {
    console.error("Error sending email notification:", err);
  }
}; 