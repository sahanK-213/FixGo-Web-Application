<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../vendor/autoload.php';

class EmailSender {
    /**
     * Sends a verification email to the user.
     *
     * @param string $email The recipient email.
     * @param string $token The verification token.
     * @return bool True if mail was sent, false otherwise.
     */
    public static function sendVerificationEmail($email, $token) {
        $subject = "FixGo - Verify Your Email Address";
        
        $message = "Hello,<br><br>";
        $message .= "Thank you for registering with FixGo! Please verify your email address to activate your account. Your One-Time Password (OTP) is:<br><br>";
        $message .= "<strong style='font-size: 24px; letter-spacing: 2px; color: #059669;'>" . htmlspecialchars($token) . "</strong><br><br>";
        $message .= "This OTP is valid for 5 minutes. Please enter it on the verification page.<br><br>";
        $message .= "If you did not create an account, no further action is required.<br><br>";
        $message .= "Best regards,<br>";
        $message .= "The FixGo Team";

        $mail = new PHPMailer(true);
        try {
            // Server settings
            $mail->isSMTP();
            $mail->Host       = getenv('SMTP_HOST') ?: 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = getenv('SMTP_USER');
            $mail->Password   = getenv('SMTP_PASS');
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = getenv('SMTP_PORT') ?: 587;

            // Recipients
            $mail->setFrom(getenv('SMTP_USER') ?: 'no-reply@fixgo.com', 'FixGo Team');
            $mail->addAddress($email);

            // Content
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $message;
            $mail->AltBody = strip_tags(str_replace(['<br>', '<br><br>'], ["\n", "\n\n"], $message));

            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log("SMTP Send Error: {$mail->ErrorInfo}");
            return false;
        }
    }

    /**
     * Sends a professional HTML invoice email to a shop owner upon dispatch.
     *
     * @param string $email        Shop owner email.
     * @param string $shopName     Shop name.
     * @param array  $invoiceData  Keys: invoiceReference, billingPeriodYear, billingPeriodMonth, totalAmount, dueDate.
     * @return bool
     */
    public static function sendInvoiceEmail(string $email, string $shopName, array $invoiceData): bool {
        $ref       = htmlspecialchars($invoiceData['invoiceReference']);
        $year      = (int)$invoiceData['billingPeriodYear'];
        $month     = (int)$invoiceData['billingPeriodMonth'];
        $amount    = number_format((float)$invoiceData['totalAmount'], 2);
        $dueDate   = htmlspecialchars($invoiceData['dueDate']);
        $period    = date('F Y', mktime(0, 0, 0, $month, 1, $year));
        $shopSafe  = htmlspecialchars($shopName);

        $bankName   = htmlspecialchars(getenv('BANK_NAME')           ?: 'Bank of Ceylon');
        $bankAccName= htmlspecialchars(getenv('BANK_ACCOUNT_NAME')   ?: 'FixGo Pvt Ltd');
        $bankAcc    = htmlspecialchars(getenv('BANK_ACCOUNT_NUMBER') ?: 'N/A');
        $bankBranch = htmlspecialchars(getenv('BANK_BRANCH')         ?: 'Colombo');

        $subject = "FixGo Invoice — {$period} | Ref: {$ref}";

        $body = "
        <div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden'>
          <div style='background:#16a34a;padding:24px;text-align:center'>
            <h1 style='color:#fff;margin:0;font-size:22px'>FixGo Invoice</h1>
            <p style='color:#bbf7d0;margin:4px 0 0'>Billing Period: {$period}</p>
          </div>
          <div style='padding:28px'>
            <p>Dear <strong>{$shopSafe}</strong>,</p>
            <p>Your platform invoice for <strong>{$period}</strong> has been generated. Please review the details below and complete your payment before the due date to avoid service interruption.</p>
            <table style='width:100%;border-collapse:collapse;margin:20px 0'>
              <tr style='background:#f9fafb'><td style='padding:10px;border:1px solid #e5e7eb;font-weight:bold'>Invoice Reference</td><td style='padding:10px;border:1px solid #e5e7eb;font-family:monospace'>{$ref}</td></tr>
              <tr><td style='padding:10px;border:1px solid #e5e7eb;font-weight:bold'>Amount Due (LKR)</td><td style='padding:10px;border:1px solid #e5e7eb;font-size:18px;font-weight:bold;color:#16a34a'>{$amount}</td></tr>
              <tr style='background:#f9fafb'><td style='padding:10px;border:1px solid #e5e7eb;font-weight:bold'>Payment Due By</td><td style='padding:10px;border:1px solid #e5e7eb;color:#dc2626;font-weight:bold'>{$dueDate}</td></tr>
            </table>
            <div style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:16px;margin-top:16px'>
              <p style='margin:0 0 8px;font-weight:bold'>Bank Transfer Details</p>
              <p style='margin:4px 0'>Bank: <strong>{$bankName}</strong></p>
              <p style='margin:4px 0'>Account Name: <strong>{$bankAccName}</strong></p>
              <p style='margin:4px 0'>Account Number: <strong>{$bankAcc}</strong></p>
              <p style='margin:4px 0'>Branch: <strong>{$bankBranch}</strong></p>
              <p style='margin:8px 0 0;color:#6b7280;font-size:13px'>Use your Invoice Reference <strong>{$ref}</strong> as the payment description.</p>
            </div>
            <p style='margin-top:20px'>After completing the transfer, please log in to the FixGo portal and upload your payment slip to avoid automatic suspension.</p>
            <p style='color:#6b7280;font-size:13px'>The FixGo Team</p>
          </div>
        </div>";

        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host       = getenv('SMTP_HOST') ?: 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = getenv('SMTP_USER');
            $mail->Password   = getenv('SMTP_PASS');
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = getenv('SMTP_PORT') ?: 587;
            $mail->setFrom(getenv('SMTP_USER') ?: 'no-reply@fixgo.com', 'FixGo Billing');
            $mail->addAddress($email);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $body;
            $mail->AltBody = "FixGo Invoice | {$period} | Ref: {$ref} | Amount: LKR {$amount} | Due: {$dueDate}";
            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log("Invoice Email Error: {$mail->ErrorInfo}");
            return false;
        }
    }

    /**
     * Sends a password reset email to the user.
     *
     * @param string $email The recipient email.
     * @param string $token The password reset OTP token.
     * @return bool True if mail was sent, false otherwise.
     */
    public static function sendPasswordResetEmail($email, $token) {
        $subject = "FixGo - Password Reset Request";
        
        $message = "Hello,<br><br>";
        $message .= "We received a request to reset your password. Your One-Time Password (OTP) for password reset is:<br><br>";
        $message .= "<strong style='font-size: 24px; letter-spacing: 2px; color: #059669;'>" . htmlspecialchars($token) . "</strong><br><br>";
        $message .= "This OTP is valid for 15 minutes. Please enter it on the password reset page.<br><br>";
        $message .= "If you did not request a password reset, please ignore this email or contact support if you have concerns.<br><br>";
        $message .= "Best regards,<br>";
        $message .= "The FixGo Team";

        $mail = new PHPMailer(true);
        try {
            // Server settings
            $mail->isSMTP();
            $mail->Host       = getenv('SMTP_HOST') ?: 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = getenv('SMTP_USER');
            $mail->Password   = getenv('SMTP_PASS');
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = getenv('SMTP_PORT') ?: 587;

            // Recipients
            $mail->setFrom(getenv('SMTP_USER') ?: 'no-reply@fixgo.com', 'FixGo Team');
            $mail->addAddress($email);

            // Content
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $message;
            $mail->AltBody = strip_tags(str_replace(['<br>', '<br><br>'], ["\n", "\n\n"], $message));

            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log("SMTP Send Error: {$mail->ErrorInfo}");
            return false;
        }
    }

    /**
     * Sends a payment rejection notification to a shop owner.
     *
     * @param string $email       Shop owner email.
     * @param string $shopName    Shop name.
     * @param array  $invoiceData Keys: invoiceReference, billingPeriodYear, billingPeriodMonth, totalAmount.
     * @param string $reason      Admin-provided rejection reason.
     * @return bool
     */
    public static function sendRejectionEmail(string $email, string $shopName, array $invoiceData, string $reason): bool {
        $ref      = htmlspecialchars($invoiceData['invoiceReference']);
        $year     = (int)$invoiceData['billingPeriodYear'];
        $month    = (int)$invoiceData['billingPeriodMonth'];
        $amount   = number_format((float)$invoiceData['totalAmount'], 2);
        $dueDate  = htmlspecialchars($invoiceData['dueDate'] ?? 'your due date');
        $period   = date('F Y', mktime(0, 0, 0, $month, 1, $year));
        $shopSafe = htmlspecialchars($shopName);
        $reasonSafe = htmlspecialchars($reason);

        $subject = "FixGo — Payment Slip Rejected | Ref: {$ref}";

        $body = "
        <div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden'>
          <div style='background:#dc2626;padding:24px;text-align:center'>
            <h1 style='color:#fff;margin:0;font-size:22px'>Payment Slip Rejected</h1>
            <p style='color:#fecaca;margin:4px 0 0'>Action Required</p>
          </div>
          <div style='padding:28px'>
            <p>Dear <strong>{$shopSafe}</strong>,</p>
            <p>Your payment slip for invoice <strong>{$ref}</strong> ({$period} — LKR {$amount}) has been reviewed and <strong style='color:#dc2626'>rejected</strong> for the following reason:</p>
            <div style='background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:16px;margin:16px 0'>
              <p style='margin:0;font-weight:bold;color:#991b1b'>{$reasonSafe}</p>
            </div>
            <p>Please log in to the FixGo portal immediately, verify your bank transfer details, and re-upload a valid payment slip. To avoid automatic account suspension, please ensure a valid slip is uploaded and verified before your grace period expires (<strong>{$dueDate}</strong>).</p>
            <p style='color:#6b7280;font-size:13px'>The FixGo Team</p>
          </div>
        </div>";

        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host       = getenv('SMTP_HOST') ?: 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = getenv('SMTP_USER');
            $mail->Password   = getenv('SMTP_PASS');
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = getenv('SMTP_PORT') ?: 587;
            $mail->Timeout    = 5; // Fail fast if SMTP hangs
            $mail->setFrom(getenv('SMTP_USER') ?: 'no-reply@fixgo.com', 'FixGo Billing');
            $mail->addAddress($email);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $body;
            $mail->AltBody = "Payment slip rejected for {$ref}. Reason: {$reason}";
            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log("Rejection Email Error: {$mail->ErrorInfo}");
            return false;
        }
    }

    /**
     * Sends a suspension notification to an overdue shop.
     *
     * @param string $email       Shop owner email.
     * @param string $shopName    Shop name.
     * @param array  $invoiceData Keys: invoiceReference, billingPeriodYear, billingPeriodMonth, totalAmount.
     * @return bool
     */
    public static function sendSuspensionEmail(string $email, string $shopName, array $invoiceData): bool {
        $ref      = htmlspecialchars($invoiceData['invoiceReference']);
        $year     = (int)$invoiceData['billingPeriodYear'];
        $month    = (int)$invoiceData['billingPeriodMonth'];
        $amount   = number_format((float)$invoiceData['totalAmount'], 2);
        $period   = date('F Y', mktime(0, 0, 0, $month, 1, $year));
        $shopSafe = htmlspecialchars($shopName);

        $subject = "FixGo — Account Suspended (Overdue Payment) | Ref: {$ref}";

        $body = "
        <div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden'>
          <div style='background:#991b1b;padding:24px;text-align:center'>
            <h1 style='color:#fff;margin:0;font-size:22px'>Account Suspended</h1>
            <p style='color:#fecaca;margin:4px 0 0'>Overdue Invoice</p>
          </div>
          <div style='padding:28px'>
            <p>Dear <strong>{$shopSafe}</strong>,</p>
            <p>Your FixGo portal account has been <strong style='color:#991b1b'>deactivated</strong> because the grace period for invoice <strong>{$ref}</strong> ({$period} — LKR {$amount}) has expired without a verified payment.</p>
            <p>Since your portal access is now suspended, you cannot upload payment slips directly. Please settle the outstanding amount immediately and confirm your payment by <strong>replying directly to this email with your payment proof attached</strong>.</p>
            <p>Your account will remain deactivated until the payment is manually verified by the admin team.</p>
            <p style='color:#6b7280;font-size:13px'>The FixGo Team</p>
          </div>
        </div>";

        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host       = getenv('SMTP_HOST') ?: 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = getenv('SMTP_USER');
            $mail->Password   = getenv('SMTP_PASS');
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = getenv('SMTP_PORT') ?: 587;
            $mail->Timeout    = 5; // Fail fast if SMTP hangs
            $mail->setFrom(getenv('SMTP_USER') ?: 'no-reply@fixgo.com', 'FixGo Billing');
            $mail->addAddress($email);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $body;
            $mail->AltBody = "Your account is deactivated due to an overdue payment for {$ref}. Please reply to this email with your payment proof.";
            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log("Suspension Email Error: {$mail->ErrorInfo}");
            return false;
        }
    }
}
