import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import crypto from "crypto";

// Load environment variables
dotenv.config();

// In-memory database for clients
interface Client {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  password?: string;
  plan: string;
  status: 'active' | 'cancelled';
  expiresAt: string;
  createdAt: string;
}

let clients: Client[] = [];
let resetCodes: { [email: string]: { code: string, expires: number } } = {};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Lazy initialization of Razorpay Client to avoid crashing if credentials are not set on start
  let razorpayClient: any = null;
  function getRazorpayClient() {
    if (!razorpayClient) {
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keyId || !keySecret) {
        throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required environment variables");
      }
      razorpayClient = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    }
    return razorpayClient;
  }

  // API routes
  app.post("/api/create-order", async (req, res) => {
    try {
      const { amount, currency = "INR", receipt } = req.body;

      if (!amount || typeof amount !== "number" || amount < 100) {
        return res.status(400).json({ 
          success: false, 
          error: "Invalid amount. Minimum amount is 100 paise (1 INR)." 
        });
      }

      const rzp = getRazorpayClient();
      const options = {
        amount, // in paise
        currency,
        receipt: receipt || `receipt_${Date.now()}`,
      };

      const order = await rzp.orders.create(options);
      res.json({
        success: true,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
      });
    } catch (error: any) {
      console.error("Error creating Razorpay order:", error);
      
      // Handle authentication or configuration failures gracefully
      if (error.statusCode === 401 || (error.message && error.message.toLowerCase().includes("auth"))) {
        return res.status(401).json({ 
          success: false, 
          error: "Razorpay authentication failed. Please verify your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET." 
        });
      }
      
      res.status(500).json({ 
        success: false, 
        error: error.message || "Failed to create Razorpay order" 
      });
    }
  });

  app.post("/api/verify-payment", (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email, plan } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required verification parameters (order_id, payment_id, signature)." 
        });
      }

      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        return res.status(500).json({ 
          success: false, 
          error: "Razorpay Key Secret is not configured on the server." 
        });
      }

      // Generate the signature to compare
      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature === razorpay_signature) {
        // Payment verified successfully
        // Update client status/plan if info was passed
        if (email && plan) {
          const client = clients.find(c => c.email === email);
          if (client) {
            client.plan = plan;
            client.status = "active";
            const daysToAdd = plan === 'Yearly Plan' ? 365 : 30;
            client.expiresAt = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();
          }
        }
        
        return res.json({ 
          success: true, 
          message: "Payment verified and processed successfully." 
        });
      } else {
        return res.status(400).json({ 
          success: false, 
          error: "Payment signature verification failed. Potential tampering detected." 
        });
      }
    } catch (error: any) {
      console.error("Error verifying payment signature:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Failed to verify signature" 
      });
    }
  });

  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const client = clients.find(c => c.email === email && c.password === password);

    if (client) {
      res.json({ success: true, user: client });
    } else {
      res.status(401).json({ success: false, error: "Invalid email or password" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      resetCodes[email] = { code, expires: Date.now() + 15 * 60 * 1000 }; // 15 mins

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: Number(process.env.SMTP_PORT) || 587,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"A D Professional Solution" <${process.env.SMTP_USER}>`,
          to: email,
          subject: "Password Reset Code - A D Professional Solution",
          text: `Your password reset code is: ${code}. It will expire in 15 minutes.`,
          html: `
            <h3>Password Reset Request</h3>
            <p>You requested a password reset. Use the code below to reset your password:</p>
            <h2 style="color: #00A63F; letter-spacing: 5px;">${code}</h2>
            <p>This code will expire in 15 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          `,
        });
      } else {
        console.log(`Mock Reset Email for ${email}: Code is ${code}`);
      }

      res.json({ success: true, message: "Reset code sent to your email." });
    } catch (error) {
      console.error("Error in forgot-password:", error);
      res.status(500).json({ success: false, error: "Failed to send reset code." });
    }
  });

  app.post("/api/auth/verify-reset-code", (req, res) => {
    const { email, code } = req.body;
    const entry = resetCodes[email];

    if (entry && entry.code === code && entry.expires > Date.now()) {
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, error: "Invalid or expired code." });
    }
  });

  app.post("/api/signup", async (req, res) => {
    try {
      const { name, email, whatsapp, password, plan } = req.body;

      // Check if user already exists
      if (clients.find(c => c.email === email)) {
        return res.status(400).json({ success: false, error: "User already exists" });
      }

      // Add to in-memory database
      const newClient: Client = {
        id: Math.random().toString(36).substring(2, 9),
        name,
        email,
        whatsapp,
        password,
        plan: plan || 'Free Plan',
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        createdAt: new Date().toISOString()
      };
      clients.push(newClient);

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: Number(process.env.SMTP_PORT) || 587,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const info = await transporter.sendMail({
          from: `"A D Professional Solution" <${process.env.SMTP_USER}>`,
          to: "adprofessionalsolution@gmail.com",
          subject: "New Client Signup - A D Professional Solution",
          text: `A new client has signed up!\n\nName: ${name}\nEmail: ${email}\nWhatsApp: ${whatsapp}\nPlan: ${plan || 'Free Plan'}`,
          html: `
            <h3>New Client Signup</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>WhatsApp:</strong> ${whatsapp}</p>
            <p><strong>Plan:</strong> ${plan || 'Free Plan'}</p>
          `,
        });
        console.log("Signup email sent: %s", info.messageId);
      } else {
        console.log("Mock Signup Email (SMTP not configured):", { name, email, whatsapp, plan });
      }

      res.json({ success: true, message: "Signup successful." });
    } catch (error) {
      console.error("Error sending email:", error);
      // Return success to the frontend even if email fails, so the user isn't blocked
      res.json({ success: true, message: "Signup successful, but email notification failed." });
    }
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, mobile, description } = req.body;

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: Number(process.env.SMTP_PORT) || 587,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const info = await transporter.sendMail({
          from: `"A D Professional Solution" <${process.env.SMTP_USER}>`,
          to: "adprofessionalsolution@gmail.com",
          subject: "New Contact Us Inquiry - A D Professional Solution",
          text: `A new inquiry has been submitted!\n\nName: ${name}\nEmail: ${email}\nMobile: ${mobile}\nDescription: ${description}`,
          html: `
            <h3>New Contact Us Inquiry</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Mobile:</strong> ${mobile}</p>
            <p><strong>Description:</strong> ${description}</p>
          `,
        });
        console.log("Contact inquiry email sent: %s", info.messageId);
      } else {
        console.log("Mock Contact Inquiry Email (SMTP not configured):", { name, email, mobile, description });
      }

      res.json({ success: true, message: "Inquiry sent successfully." });
    } catch (error) {
      console.error("Error sending email:", error);
      // Return success to the frontend even if email fails, so the user isn't blocked
      res.json({ success: true, message: "Inquiry recorded, but email notification failed." });
    }
  });

  // Admin API routes
  app.get("/api/admin/clients", (req, res) => {
    res.json({ success: true, clients });
  });

  app.post("/api/admin/clients/:id/status", (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // 'cancel' or 'extend'

    const client = clients.find(c => c.id === id);
    if (!client) {
      return res.status(404).json({ success: false, error: "Client not found" });
    }

    if (action === 'cancel') {
      client.status = 'cancelled';
    } else if (action === 'extend') {
      client.status = 'active';
      // Extend by 30 days
      const currentExpiry = new Date(client.expiresAt);
      client.expiresAt = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    res.json({ success: true, client });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
