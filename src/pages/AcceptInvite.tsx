import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { isValidUUID } from "@/lib/getRoleBasedRedirect";

/**
 * Redireciona corretamente usando ID do convite
 */
export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get("id");
  const navigate = useNavigate();

  useEffect(() => {
    if (inviteId && isValidUUID(inviteId)) {
      // Redireciona para a página real que processa o convite
      navigate(`/invite/${encodeURIComponent(inviteId)}`, { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [inviteId, navigate]);

  return null;
}
