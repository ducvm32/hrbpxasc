import { NextRequest, NextResponse } from "next/server";
import { readDB } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";
import {
  decodeGoogleFlow,
  exchangeCodeForTokens,
  verifyIdToken,
  GOOGLE_FLOW_COOKIE_NAME,
} from "@/lib/google-oauth";

// Dùng Location header dạng đường dẫn tương đối (không build URL tuyệt đối từ
// req.url) — sau reverse proxy, Next.js có thể thấy Host là địa chỉ bind nội
// bộ (VD 0.0.0.0:3000) nếu proxy không forward đúng header Host, khiến
// NextResponse.redirect(new URL(path, req.url)) redirect trình duyệt sang một
// địa chỉ không thể truy cập được. Location tương đối luôn được trình duyệt
// tự resolve theo đúng domain thật đang hiển thị trên address bar.
function redirectTo(path: string, status = 307): NextResponse {
  return new NextResponse(null, { status, headers: { Location: path } });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");
  const flow = decodeGoogleFlow(req.cookies.get(GOOGLE_FLOW_COOKIE_NAME)?.value);

  const fail = (message: string) => {
    const res = redirectTo(`/login?google_error=${encodeURIComponent(message)}`);
    res.cookies.delete(GOOGLE_FLOW_COOKIE_NAME);
    return res;
  };

  if (oauthError) return fail(oauthError === "access_denied" ? "Bạn đã huỷ đăng nhập Google" : oauthError);
  if (!code || !state || !flow || flow.state !== state) {
    return fail("Phiên đăng nhập Google không hợp lệ hoặc đã hết hạn, vui lòng thử lại");
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const claims = await verifyIdToken(tokens.id_token, flow.nonce);
    const email = String(claims.email || "").trim().toLowerCase();
    const hoTen = String(claims.name || "").trim();

    if (!email) return fail("Không lấy được email từ tài khoản Google");

    const db = readDB();
    const admin = db.admin_users.find((u) => u.email.toLowerCase() === email);
    const hrbp = db.hrbp_users.find((u) => u.email.toLowerCase() === email);
    const sup = db.sup_users.find((u) => u.email.toLowerCase() === email);

    let dest: string;
    if (admin) {
      setSessionCookie({ role: "admin", id: admin.id, ho_ten: hoTen || admin.ho_ten, ma_nv: admin.id });
      dest = "/admin";
    } else if (hrbp) {
      setSessionCookie({ role: "hrbp", id: hrbp.id, ho_ten: hoTen || hrbp.ho_ten, ma_nv: hrbp.ma_nv });
      dest = "/hrbp";
    } else if (sup) {
      setSessionCookie({ role: "sup", id: sup.id, ho_ten: hoTen || sup.ho_ten, ma_nv: sup.ma_nv });
      dest = "/sup";
    } else {
      return fail(
        `Tài khoản Google (${email}) chưa được cấp quyền Admin/Sup/HRBP trong hệ thống này. Vui lòng liên hệ Admin.`
      );
    }

    const res = redirectTo(dest);
    res.cookies.delete(GOOGLE_FLOW_COOKIE_NAME);
    return res;
  } catch (e: any) {
    return fail(e?.message || "Xác thực Google thất bại, vui lòng thử lại");
  }
}
