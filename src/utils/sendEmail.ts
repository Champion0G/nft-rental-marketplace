import sgMail from "@sendgrid/mail";
import { formatTime } from "./format";

if (!process.env.NEXT_PUBLIC_SENDGRID_API_KEY) {
  console.warn("SendGrid API key not found. Email notifications will be disabled.");
}

sgMail.setApiKey(process.env.NEXT_PUBLIC_SENDGRID_API_KEY || "");

interface EmailOptions {
  to: string;
  tokenId: number;
  remainingTime: number;
  renter: string;
}

export const sendRentalExpiryEmail = async ({
  to,
  tokenId,
  remainingTime,
  renter,
}: EmailOptions): Promise<boolean> => {
  if (!process.env.NEXT_PUBLIC_SENDGRID_API_KEY) {
    console.warn("SendGrid API key not found. Skipping email notification.");
    return false;
  }

  try {
    const msg = {
      to,
      from: process.env.NEXT_PUBLIC_SENDGRID_FROM_EMAIL || "no-reply@nftmarketplace.com",
      subject: "Your NFT Rental is About to Expire",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0f3460;">NFT Rental Expiry Notice</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #e94560; margin-top: 0;">Action Required</h3>
            <p>Your NFT rental is about to expire:</p>
            
            <ul style="list-style: none; padding: 0;">
              <li><strong>Token ID:</strong> #${tokenId}</li>
              <li><strong>Time Remaining:</strong> ${formatTime(remainingTime)}</li>
              <li><strong>Wallet Address:</strong> ${renter}</li>
            </ul>
          </div>

          <div style="margin-top: 20px;">
            <p>To avoid any disruption in service, please take one of the following actions:</p>
            <ol>
              <li>Return the NFT if you no longer need it</li>
              <li>Extend your rental period if you wish to continue using the NFT</li>
            </ol>
          </div>

          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      `,
    };

    await sgMail.send(msg);
    console.log(`Email notification sent to ${to} for Token ID ${tokenId}`);
    return true;
  } catch (err) {
    console.error("Error sending email notification:", err);
    return false;
  }
}; 