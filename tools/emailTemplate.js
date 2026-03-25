/**
 * tools/emailTemplate.js
 *
 * Génère un email HTML professionnel avec le branding GEID.
 *
 * @param {Object} options
 * @param {string} options.title     — Titre affiché dans le header du mail
 * @param {string} options.greeting  — Ligne de salutation ("Bonjour Jean,")
 * @param {string} options.body      — Contenu HTML (paragraphes, listes…)
 * @param {string} [options.ctaLabel] — Texte du bouton d'action
 * @param {string} [options.ctaUrl]   — URL du bouton d'action
 * @param {string} [options.footer]   — Texte additionnel de pied de page
 * @returns {string} HTML complet de l'email
 */
module.exports = function buildEmail({ title, greeting, body, ctaLabel, ctaUrl, footer }) {
	const ctaBlock = ctaLabel && ctaUrl
		? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto 0 auto;">
				<tr>
					<td align="center" style="border-radius:6px;background-color:#1a237e;">
						<a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px;">
							${ctaLabel}
						</a>
					</td>
				</tr>
			</table>`
		: '';

	const footerExtra = footer
		? `<p style="margin:0 0 12px 0;font-size:13px;color:#666666;">${footer}</p>`
		: '';

	return `<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
	<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f5f5;">
		<tr>
			<td align="center" style="padding:24px 16px;">
				<!-- Container -->
				<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">

					<!-- Header -->
					<tr>
						<td style="background:linear-gradient(135deg,#1a237e 0%,#0d47a1 100%);padding:32px 40px;border-radius:8px 8px 0 0;text-align:center;">
							<h1 style="margin:0 0 4px 0;font-size:28px;font-weight:bold;color:#ffffff;letter-spacing:2px;">GEID</h1>
							<p style="margin:0 0 16px 0;font-size:13px;color:#bbdefb;letter-spacing:0.5px;">Secrétariat Général du Budget</p>
							<p style="margin:0;font-size:17px;font-weight:bold;color:#ffffff;">${title}</p>
						</td>
					</tr>

					<!-- Body -->
					<tr>
						<td style="background-color:#ffffff;padding:36px 40px 32px 40px;">
							<p style="margin:0 0 20px 0;font-size:15px;color:#333333;font-weight:bold;">${greeting}</p>
							<div style="font-size:14px;color:#444444;line-height:1.7;">
								${body}
							</div>
							${ctaBlock}
						</td>
					</tr>

					<!-- Footer -->
					<tr>
						<td style="background-color:#fafafa;padding:24px 40px;border-radius:0 0 8px 8px;border-top:1px solid #eeeeee;text-align:center;">
							${footerExtra}
							<p style="margin:0 0 8px 0;font-size:12px;color:#999999;">
								Cet email a été envoyé automatiquement par le système GEID.<br>
								Merci de ne pas répondre à ce message.
							</p>
							<p style="margin:0;font-size:11px;color:#bbbbbb;">
								&copy; ${new Date().getFullYear()} GEID &mdash; Secrétariat Général du Budget, RDC
							</p>
						</td>
					</tr>

				</table>
			</td>
		</tr>
	</table>
</body>
</html>`;
};
