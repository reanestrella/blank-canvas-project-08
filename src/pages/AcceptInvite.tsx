import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { isValidUUID } from "@/lib/getRoleBasedRedirect";

/**
 * Legacy redirect — all invite acceptance now goes through InviteGate.
 */
export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (token && isValidUUID(token)) {
      navigate(`/accept-invite?token=${encodeURIComponent(token)}`, { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [token, navigate]);

  return null;
}
