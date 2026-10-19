const path = require("path");

// PNG exports of the frontend auth/profile icons, plus a shared information icon.
const emailAttachments = (icon) =>
  [icon, "warning"].map((name) => ({
    filename: `${name}.png`,
    path: path.join(__dirname, "../assets/email", `${name}.png`),
    cid: `${name}@mail.znac.org`,
    contentType: "image/png",
    contentDisposition: "inline",
  }));

const ACCENT = "#4990A8";
const SUPPORT_EMAIL = "znacompany@gmail.com";
const SITE_URL = "https://znac.org";
const supportLink = (label) =>
  `<a href="mailto:${SUPPORT_EMAIL}" style="color: ${ACCENT}; text-decoration: none;">${label}</a>`;

const actionButton = (url, label, instruction) => `
  ${instruction ? `<tr><td align="center" style="padding: 24px 0 0; color: #405168; font-size: 16px; line-height: 24px;">${instruction}</td></tr>` : ""}
  <tr>
    <td align="center" style="padding: ${instruction ? "20" : "28"}px 0 0;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100%; max-width: 360px;">
        <tr>
          <td align="center" bgcolor="${ACCENT}" style="background-color: ${ACCENT}; border-radius: 8px; mso-padding-alt: 16px 24px;">
            <a class="email-button" href="${url}" style="display: block; padding: 16px 24px; border: 1px solid ${ACCENT}; border-radius: 8px; color: #ffffff; font-size: 18px; line-height: 24px; font-weight: 600; text-decoration: none; mso-padding-alt: 0;">${label}</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

const securityEmail = ({
  title,
  preheader,
  icon,
  iconAlt,
  action,
  hint,
  notice,
}) => `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>${title}</title>
    <style>
      body { margin: 0; padding: 0; }
      table { mso-table-lspace: 0; mso-table-rspace: 0; }
      a { -webkit-text-size-adjust: 100%; }
      @media only screen and (min-width: 600px) {
        .email-container { max-width: 420px !important; }
      }
      @media only screen and (max-width: 600px) {
        .email-button { font-size: 16px !important; }
      }
      @media only screen and (max-width: 480px) {
        .email-outer { padding: 20px 12px !important; }
        .email-card { padding: 24px 20px !important; }
        .email-brand { font-size: 24px !important; }
        .email-category { font-size: 11px !important; }
        .email-illustration { padding-top: 36px !important; }
        .email-title { font-size: 20px !important; line-height: 28px !important; }
        .email-notice { padding: 18px 16px !important; }
      }
      @media only screen and (max-width: 320px) {
        .email-footer-contact, .email-footer-brand { display: block !important; width: 100% !important; text-align: left !important; }
        .email-footer-brand { padding-top: 12px !important; }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; width: 100%; background-color: #f3f5f7; color: #0f1b27; font-family: Arial, Helvetica, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
    <div style="display: none; font-size: 1px; line-height: 1px; color: #f3f5f7; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all;">${preheader}</div>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f3f5f7" style="width: 100%; background-color: #f3f5f7;">
      <tr>
        <td class="email-outer" align="center" style="padding: 40px 16px;">
          <!--[if mso]><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="420" align="center"><tr><td><![endif]-->
          <table class="email-container" role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 14px;">
            <tr>
              <td class="email-card" style="padding: 32px 36px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100%;">
                  <tr>
                    <td class="email-brand" align="left" style="font-size: 30px; line-height: 36px; font-weight: 700; letter-spacing: -1px;">
                      <a href="${SITE_URL}" style="color: #0f1b27; text-decoration: none;">znac<span style="color: ${ACCENT};">.org</span></a>
                    </td>
                    <td class="email-category" align="right" style="color: #526078; font-size: 14px; line-height: 20px;">Account security</td>
                  </tr>
                  <tr>
                    <td class="email-illustration" colspan="2" align="center" style="padding: 48px 0 0;">
                      <img src="cid:${icon}@mail.znac.org" width="128" height="128" alt="${iconAlt}" style="display: block; width: 128px; height: 128px; border: 0;">
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" align="center" style="padding: 24px 0 0;">
                      <h1 class="email-title" style="margin: 0; color: #0f1b27; font-size: 24px; line-height: 32px; font-weight: 700; letter-spacing: -0.6px;">${title}</h1>
                    </td>
                  </tr>
                </table>
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100%;">
                  ${action ? actionButton(action.url, action.label, action.instruction) : ""}
                  ${hint ? `<tr><td align="center" style="padding: 14px 0 0; color: #64748b; font-size: 13px; line-height: 20px;">${hint}</td></tr>` : ""}
                  <tr>
                    <td style="padding: ${action ? "32" : "48"}px 0 0;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f1f5f9" style="width: 100%; background-color: #f1f5f9; border-radius: 10px;">
                        <tr>
                          <td class="email-notice" style="padding: 20px 24px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100%;">
                              <tr>
                                <td width="32" valign="middle" style="width: 32px;"><img src="cid:warning@mail.znac.org" width="32" height="32" alt="Security notice" style="display: block; width: 32px; height: 32px; border: 0;"></td>
                                <td width="16" style="width: 16px;">&nbsp;</td>
                                <td valign="middle" style="color: #526078; font-size: 14px; line-height: 22px;">${notice}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 0 0;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100%; border-top: 1px solid #dfe6ed;">
                        <tr>
                          <td class="email-footer-contact" align="left" valign="top" style="padding-top: 20px; color: #64748b; font-size: 12px; line-height: 20px;">Need help? Contact us:<br>${supportLink(SUPPORT_EMAIL)}</td>
                          <td class="email-footer-brand" align="right" valign="bottom" style="padding-top: 20px; color: #64748b; font-size: 12px; line-height: 20px;"><a href="${SITE_URL}" style="color: ${ACCENT}; text-decoration: none;">znac.org</a></td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <!--[if mso]></td></tr></table><![endif]-->
        </td>
      </tr>
    </table>
  </body>
</html>`;

const resetPasswordEmailMarkup = (token) =>
  securityEmail({
    title: "We got a request to reset your password",
    preheader: "Reset your ZNAC password. This link expires in 20 minutes.",
    icon: "forgot-password",
    iconAlt: "Password recovery",
    action: {
      url: `${SITE_URL}/reset-password/${encodeURIComponent(token)}`,
      label: "Reset",
      instruction: "Please click the button below to reset it:",
    },
    hint: "This link expires in 20 minutes and can be used only once.",
    notice: `If you ignore this message, your password will not be changed. If you didn't request a password reset, ${supportLink("let us know.")}`,
  });

const successfullPasswordUpdateEmailMarkup = securityEmail({
  title: "Your password has been changed",
  preheader: "Your ZNAC account password has been successfully changed.",
  icon: "password-changed",
  iconAlt: "Password successfully changed",
  notice: `If you didn&rsquo;t make this change, ${supportLink("let us know immediately")}.`,
});

const successfulEmailUpdateEmailMarkup = securityEmail({
  title: "Your email address has been changed",
  preheader: "Your ZNAC account email address has been successfully changed.",
  icon: "update-email",
  iconAlt: "Email address changed",
  notice: `If you didn&rsquo;t make this change, ${supportLink("let us know immediately")}.`,
});

const emailConfirmationEmailMarkup = (token, address) =>
  securityEmail({
    title: `Confirm your ${address === "current" ? "current" : "new"} email address`,
    preheader:
      "Confirm your current and new email addresses within 20 minutes.",
    icon: "update-email",
    iconAlt: "Email address change",
    action: {
      url: `${SITE_URL}/profile/update-email/${encodeURIComponent(token)}`,
      label: "Review and confirm",
    },
    hint: "Confirm both addresses within 20 minutes. Sign in to the account you are updating.",
    notice: `If you ignore this message, your email will not be changed. If you didn't request a email change, ${supportLink("let us know.")}`,
  });

module.exports = {
  emailAttachments,
  resetPasswordEmailMarkup,
  successfullPasswordUpdateEmailMarkup,
  successfulEmailUpdateEmailMarkup,
  emailConfirmationEmailMarkup,
};
