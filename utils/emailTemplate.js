const fs = require("fs")
const path = require("path")

exports.loadEmailTemplate = (templateName, replacements) => {
    const filePath = path.join(__dirname, `../templates/${templateName}.html`);

    let html = fs.readFileSync(filePath, "utf8");

    Object.keys(replacements).forEach((key) => {
        const regex = RegExp(`{{${key}}}`, "g");
        html = html.replace(regex, replacements[key]);
    });

    return html;
}