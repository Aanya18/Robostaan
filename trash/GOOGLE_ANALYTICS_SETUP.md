# Google Analytics Setup Guide

Follow these steps to get your Google Analytics (GA4) Measurement ID and add it to your project.

---

## 1. Go to Google Analytics
- Visit: [https://analytics.google.com/](https://analytics.google.com/)
- Sign in with your Google account.

## 2. Create a Property (if you don’t have one)
- Click **Admin** (bottom left).
- Under the **Account** column, select your account (or create one).
- Under the **Property** column, click **Create Property**.
- Enter your website name, set the time zone and currency, then click **Next**.
- Fill in business info, click **Create**.

## 3. Set Up a Data Stream
- After creating the property, you’ll be prompted to set up a data stream.
- Choose **Web**.
- Enter your website URL and stream name, then click **Create stream**.

## 4. Copy Your Measurement ID
- After creating the stream, you’ll see a page with your **Measurement ID** (looks like `G-XXXXXXXXXX`).
- Copy this ID.

## 5. Add to Your Project
- In your `.env` file, add:
  ```env
  VITE_GA_ID=G-XXXXXXXXXX
  ```
- (Replace `G-XXXXXXXXXX` with your actual ID.)

---

## Where to Use This ID
- Your project is already set up to use this ID via the environment variable and the Google Analytics integration.

---

## Summary Table

| Step                | What to Do                                 |
|---------------------|--------------------------------------------|
| 1. Go to Analytics  | https://analytics.google.com/              |
| 2. Create Property  | Admin → Create Property                    |
| 3. Add Data Stream  | Choose Web, enter your site URL            |
| 4. Copy ID          | Looks like G-XXXXXXXXXX                    |
| 5. Add to .env      | VITE_GA_ID=G-XXXXXXXXXX                    |

---

If you need screenshots or a video guide, let your developer know! 