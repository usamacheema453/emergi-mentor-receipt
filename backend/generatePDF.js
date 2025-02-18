import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Convert `import.meta.url` to `__dirname`
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generatePDF = async (res) => {
    try {
        const templatePath = path.join(__dirname, "templates", "receipt.html");
        let html = fs.readFileSync(templatePath, "utf8");

        // ✅ Use hosted logo file from Express static folder
        const logoURL = "http://localhost:5000/public/images/Emergi Mentors Logo 5.png";

        // ✅ Example purchase data (combination of 1:1 Connect & Digital Assets)
        const purchase = {
            menteeName: "John Doe",
            mentorName: "Jane Smith",
            transactionId: "TXN123456",
            mentorTitle: 'Senior Data Analyst',
            purchaseDate: new Date().toLocaleDateString(),
            amount: 100.0, // Base amount before charges
            products: [
                { type: "1:1 Connect", titles: ["Full Stack Coaching"] },
                { type: "Digital Assets", titles: ["Web Dev eBook"] },
                {
                    type: "Bundle",
                    titles: ["Full Stack Coaching", "React Crash Course", "AI Fundamentals", 'Full Stack Session', 'Mobile App PDf Course'],
                },
            ],
        };

        // ✅ Calculate charges
        const serviceCharge = (purchase.amount * 0.2).toFixed(2);
        const gst = (purchase.amount * 0.1).toFixed(2);
        const totalAmount = (purchase.amount * 1.3).toFixed(2);

        // ✅ Generate dynamic product rows for HTML table
        let productRows = purchase.products
            .map((product) => {
                // If multiple titles exist, format them as a bullet list
                const titlesList =
                    product.titles.length > 1
                        ? `<ul class="bundle-list">${product.titles
                              .map((title) => `<li>${title}</li>`)
                              .join("")}</ul>`
                        : product.titles[0];

                return `<tr><td>${product.type}</td><td>${titlesList}</td></tr>`;
            })
            .join("");

        // ✅ Replace placeholders in the HTML template
        html = html
            .replace("{{logoPath}}", logoURL)
            .replace("{{menteeName}}", purchase.menteeName)
            .replace("{{mentorName}}", purchase.mentorName)
            .replace("{{mentorTitle}}", purchase.mentorTitle)
            .replace("{{transactionId}}", purchase.transactionId)
            .replace("{{purchaseDate}}", purchase.purchaseDate)
            .replace("{{amount}}", purchase.amount.toFixed(2))
            .replace("{{serviceCharge}}", serviceCharge)
            .replace("{{gst}}", gst)
            .replace("{{totalAmount}}", totalAmount)
            .replace("{{productRows}}", productRows);

        const browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

        await browser.close();

        // ✅ Set headers for the response
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", 'attachment; filename="receipt.pdf"');
        res.setHeader("Content-Length", pdfBuffer.length);
        res.end(pdfBuffer);
    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).send("Error generating PDF");
    }
};
