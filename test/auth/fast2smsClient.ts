const FAST2SMS_API_KEY = "U3rgnjQBpPWba9ZD4lzMKNe6ioxSLwCqmAJGhH5tcOYIuTv7yXJyf9aORQwZvgbCLW2H65sYjVzkDd1X";

export function generateOtp(): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log("✅ Generated OTP:", otp);
  return otp;
}

export async function sendOtpSMSFast2SMS(phone: string, otp: string) {
  console.log("➡️ Sending OTP via Fast2SMS Quick SMS API");

  // Fast2SMS expects numbers without "+" for India
  let formattedPhone = phone.replace("+91", "91");

  const message = `आपका Lekhapal OTP है: ${otp}`;

  const url = "https://www.fast2sms.com/dev/bulkV2";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: FAST2SMS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      route: "q", // 👈 quick SMS (works without verification)
      message,
      language: "unicode", // so Hindi works
      numbers: formattedPhone,
    }),
  });

  const json = await res.json();
  console.log("📩 Fast2SMS Response:", json);

  if (!json.return) {
    throw new Error("Fast2SMS failed: " + JSON.stringify(json));
  }

  return true;
}
